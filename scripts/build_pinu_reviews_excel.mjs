import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const APP_ID = "6758291757";
const APP_URL = `https://apps.apple.com/us/app/pinu-language-learning/id${APP_ID}`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const outputDir = path.join(repoRoot, "outputs", "pinu_reviews");
const runDate = new Date().toISOString().slice(0, 10);
const outputPath = path.join(outputDir, `Pinu_AppStore_US_Reviews_${runDate}.xlsx`);

function pct(part, total) {
  if (!total) return "0.0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function sentimentForRating(rating) {
  if (rating >= 4) return "好评";
  if (rating === 3) return "中评";
  return "差评";
}

const knownTranslations = new Map([
  [
    "13946483369",
    "终于有一款语言学习 App 不再只是让人背单词表或看图片记词，而是真的让你练习和别人交流时会用到的真实生活句子。它从第一天就能让你动起来，因为我们就是通过会实际使用的句子来学习。毫无疑问这是目前最好的 App，我会继续用。唯一需要调整的是增加更多语言，不过他们先从西班牙语开始也很聪明，因为西班牙语使用人数最多。期待更多语言！",
  ],
  [
    "14100901767",
    "刚发现这个 App，感觉很惊喜。非常简单好用，是一个很好的起点。我正在学习真实的日常句子，这一点是我用了一年 Duolingo 都没有得到的。",
  ],
  [
    "14146891169",
    "有点像 Duolingo。但我想知道它是否遵循某种课程体系。另外，如果能有一个词汇表标签页会很好。还有，当西班牙语答对时，不要只显示 correct，也应该显示英文翻译。",
  ],
  [
    "14068029324",
    "我一直在找这样的 App：免费，而且可以对它说话，这样你就知道自己说得是否正确。这是一个很棒的 App。",
  ],
  [
    "14100294144",
    "我真的很喜欢这个 App，但它一直崩溃；当我重新进入 App 时，它会让我从这一关重新开始。",
  ],
  [
    "14112551958",
    "只有一种语言可用！我本来希望像其他所有语言学习 App 一样可以选择意大利语，但唯一选项是西班牙语。它宣传得像是可以学习任何语言，但实际只提供一种。这是虚假宣传。不要下载！",
  ],
]);

function classifyReview(review) {
  const text = `${review.title || ""} ${review.contents || ""}`.toLowerCase();
  const tags = new Set();
  let priority = "P2";
  let summary = "用户反馈整体体验。";
  let action = "持续观察同类反馈。";

  if (text.includes("crash") || text.includes("crashing") || text.includes("start the level again")) {
    tags.add("崩溃");
    tags.add("进度丢失");
    tags.add("关卡体验");
    priority = "P0";
    summary = "用户喜欢 App，但遇到崩溃，重新进入后需要从关卡开头再来。";
    action = "优先修复崩溃，并保存关卡中途进度，避免用户重做。";
  }
  if (
    text.includes("only has one language") ||
    text.includes("only option is spanish") ||
    text.includes("more languages") ||
    text.includes("italian")
  ) {
    tags.add("语言数量不足");
    tags.add("多语言需求");
    if (text.includes("false advertisement") || text.includes("do not download")) {
      tags.add("宣传预期不符");
      tags.add("意大利语需求");
      priority = "P0";
      summary = "用户强烈不满只有 Spanish，没有 Italian；认为宣传像是支持多语言，实际体验不符。";
      action = "修正商店页/广告文案预期，或尽快增加语言选择。";
    } else if (priority !== "P0") {
      priority = "P1";
      summary = "用户认可产品，但明确希望增加更多语言。";
      action = "把多语言支持列为路线图重点，并在商店页明确当前支持范围。";
    }
  }
  if (text.includes("vocabulary tab")) {
    tags.add("词汇表");
    priority = priority === "P0" ? "P0" : "P1";
    summary = "用户希望增加 vocabulary tab，并进一步完善学习辅助功能。";
    action = "增加词汇表/收藏/复习入口。";
  }
  if (text.includes("course") || text.includes("certified") || text.includes("certification")) {
    tags.add("课程体系");
    tags.add("认证疑问");
    priority = priority === "P0" ? "P0" : "P1";
    action = action === "持续观察同类反馈。" ? "展示课程路径、level/unit 结构或 CEFR 映射。" : action;
  }
  if (text.includes("translation") || text.includes("english translation")) {
    tags.add("翻译反馈");
    priority = priority === "P0" ? "P0" : "P1";
    action = action === "持续观察同类反馈。" ? "答题后展示英文翻译、关键词或句子拆解。" : action;
  }
  if (text.includes("real life sentences") || text.includes("everyday sentences") || text.includes("sentences")) {
    tags.add("真实句子学习");
    tags.add("实用场景");
    if (review.rating >= 4) {
      summary = "用户认可真实日常句子学习，不只是背单词或看图记词。";
      action = "继续强化“真实句子/场景练习”作为核心卖点。";
    }
  }
  if (text.includes("simple")) tags.add("上手简单");
  if (text.includes("duolingo")) tags.add("Duolingo 对比");
  if (text.includes("free")) tags.add("免费");
  if (text.includes("talk to it") || text.includes("saying") || text.includes("speak")) {
    tags.add("语音练习");
    tags.add("发音反馈");
    if (review.rating >= 4) {
      summary = "用户认可免费语音练习和发音反馈。";
      action = "在商店页和 onboarding 中突出语音练习与发音反馈。";
    }
  }

  if (!tags.size && review.rating >= 4) {
    tags.add("整体满意");
    summary = "用户整体满意。";
    action = "保留当前体验优势，继续观察新评论。";
  }

  return {
    sentiment: sentimentForRating(review.rating),
    priority,
    tags: [...tags].join(", "),
    summary,
    action,
    translation: knownTranslations.get(review.id) || "待翻译：自动化周报运行时需补充中文翻译。",
  };
}

function tagCounts(enrichedReviews) {
  const counts = new Map();
  for (const review of enrichedReviews) {
    for (const tag of review.tags.split(",").map((item) => item.trim()).filter(Boolean)) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  for (const review of enrichedReviews) {
    counts.set(review.sentiment, (counts.get(review.sentiment) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
    .map(([tag, count]) => [tag, count, pct(count, enrichedReviews.length)]);
}

function buildActionPlan(enrichedReviews) {
  const hasCrash = enrichedReviews.some((r) => r.tags.includes("崩溃"));
  const hasLanguage = enrichedReviews.some((r) => r.tags.includes("语言数量不足") || r.tags.includes("多语言需求"));
  const hasVocabulary = enrichedReviews.some((r) => r.tags.includes("词汇表"));
  const hasTranslation = enrichedReviews.some((r) => r.tags.includes("翻译反馈"));
  const hasCourse = enrichedReviews.some((r) => r.tags.includes("课程体系"));
  const rows = [];
  if (hasCrash) rows.push(["P0", "Crash / 进度保存", "修复崩溃；保存关卡中途进度，避免用户重做。", "体验问题会直接拉低评分。"]);
  if (hasLanguage) rows.push(["P0", "多语言或商店页文案修正", "明确当前只支持哪些语言；如果短期只有 Spanish，避免泛化宣传；同步规划更多语言。", "语言数量是当前最明显的预期落差。"]);
  if (hasVocabulary) rows.push(["P1", "Vocabulary tab", "增加词汇表、收藏、复习入口。", "用户明确提出，符合语言学习产品预期。"]);
  if (hasTranslation) rows.push(["P1", "答题后翻译反馈", "答对后展示英文翻译、关键词或句子拆解。", "能增强学习闭环。"]);
  if (hasCourse) rows.push(["P2", "课程体系说明", "展示 unit/level/skill path 或 CEFR 映射。", "减少用户对系统性的疑虑。"]);
  return rows.length ? rows : [["P2", "持续监控", "继续收集新评论并观察主题变化。", "当前公开文本评论量较少。"]];
}

function setHeader(range) {
  range.format.fill = { color: "#1F4E79" };
  range.format.font = { color: "#FFFFFF", bold: true };
  range.format.borders = { preset: "all", style: "thin", color: "#D9E2F3" };
}

function setBody(range) {
  range.format.wrapText = true;
  range.format.verticalAlignment = "top";
  range.format.borders = { preset: "all", style: "thin", color: "#E7EAF0" };
}

function writeTitle(sheet, title, subtitle, lastCol = "J") {
  sheet.getRange(`A1:${lastCol}1`).merge();
  sheet.getRange("A1").values = [[title]];
  sheet.getRange("A1").format.font = { bold: true, size: 18, color: "#17365D" };
  sheet.getRange(`A2:${lastCol}2`).merge();
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange("A2").format.font = { color: "#666666", italic: true };
}

function setWidths(sheet, widths) {
  Object.entries(widths).forEach(([column, width]) => {
    sheet.getRange(`${column}:${column}`).format.columnWidthPx = width;
  });
}

const fetchScript = path.join(__dirname, "fetch_pinu_reviews.py");
const fetchOutput = execFileSync(process.env.PYTHON || "python3", [fetchScript], {
  cwd: repoRoot,
  encoding: "utf8",
  maxBuffer: 10 * 1024 * 1024,
});
const fetched = JSON.parse(fetchOutput);
if (fetched.error) throw new Error(fetched.error);
const app = fetched.app;
const extractedReviews = fetched.reviews || [];
const ratingCounts = fetched.ratingCounts || [0, 0, 0, 0, 0];

const totalRatings = app.userRatingCount || ratingCounts.reduce((sum, value) => sum + value, 0);
const averageRating = Number(app.averageUserRating || 0);
const enrichedReviews = extractedReviews
  .map((review) => {
    const analysis = classifyReview(review);
    return {
      id: review.id,
      date: review.date?.slice(0, 10) || "",
      rating: review.rating,
      sentiment: analysis.sentiment,
      priority: analysis.priority,
      tags: analysis.tags,
      user: review.reviewerName || "",
      title: review.title || "",
      summary: analysis.summary,
      action: analysis.action,
      original: review.contents || "",
      translation: analysis.translation,
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

const ratingRows = [5, 4, 3, 2, 1].map((stars) => {
  const count = ratingCounts[5 - stars] || 0;
  return [`${stars}星`, count, pct(count, totalRatings)];
});
const tags = tagCounts(enrichedReviews);
const actionPlan = buildActionPlan(enrichedReviews);

const workbook = Workbook.create();

const dashboard = workbook.worksheets.add("Dashboard");
dashboard.showGridLines = false;
writeTitle(dashboard, "Pinu App Store US Reviews", `Source: Apple App Store US. App ID ${APP_ID}. Pulled on ${runDate}.`, "H");
dashboard.getRange("A4:B12").values = [
  ["Metric", "Value"],
  ["App", app.name],
  ["Current version", app.version],
  ["Current rating", Number(averageRating.toFixed(2))],
  ["Total star ratings", totalRatings],
  ["Public text reviews", enrichedReviews.length],
  ["Latest app update", app.currentVersionReleaseDate?.slice(0, 10) || ""],
  ["Store URL", APP_URL],
  ["Template version", "v2 - ratings distribution + translations"],
];
dashboard.getRange("D4:F10").values = [["Star Rating", "Count", "Share"], ...ratingRows];
dashboard.getRange("A14:H18").values = [
  ["核心洞察", "建议", "", "", "", "", "", ""],
  ["最受好评的特性", "真实场景句子练习和开口练习。", "", "", "", "", "", ""],
  ["主要负面驱动因素", "语言数量不足，以及商店页/广告带来的多语言预期落差。", "", "", "", "", "", ""],
  ["最紧急问题", enrichedReviews.some((r) => r.tags.includes("崩溃")) ? "崩溃和关卡进度丢失。" : "继续监控稳定性。", "", "", "", "", "", ""],
  ["产品定位重点", "继续强化“实用句子练习”，避免只像背单词工具。", "", "", "", "", "", ""],
];
setHeader(dashboard.getRange("A4:B4"));
setHeader(dashboard.getRange("D4:F4"));
setHeader(dashboard.getRange("A14:B14"));
setBody(dashboard.getRange("A5:B12"));
setBody(dashboard.getRange("D5:F10"));
setBody(dashboard.getRange("A15:B18"));
setWidths(dashboard, { A: 180, B: 400, D: 120, E: 100, F: 100 });

const ratingsSheet = workbook.worksheets.add("Rating Distribution");
ratingsSheet.showGridLines = false;
writeTitle(ratingsSheet, "Rating Distribution", "All star ratings, including ratings without text reviews.", "F");
ratingsSheet.getRange("A4:C9").values = [["Star Rating", "Count", "Share"], ...ratingRows];
setHeader(ratingsSheet.getRange("A4:C4"));
setBody(ratingsSheet.getRange("A5:C9"));
ratingsSheet.tables.add("A4:C9", true, "RatingDistributionTable");
ratingsSheet.freezePanes.freezeRows(4);
setWidths(ratingsSheet, { A: 140, B: 110, C: 110 });

const reviewsSheet = workbook.worksheets.add("Text Reviews");
reviewsSheet.showGridLines = false;
writeTitle(reviewsSheet, "Text Review Details", "All public text reviews. Filter by sentiment, priority, tags, rating, or date.", "L");
const reviewHeaders = [
  "ID",
  "Date",
  "Rating",
  "Sentiment",
  "Priority",
  "Tags",
  "User",
  "Title",
  "Chinese Translation",
  "Original Review",
  "Summary",
  "Action",
];
const reviewRows = enrichedReviews.map((r) => [
  r.id,
  r.date,
  r.rating,
  r.sentiment,
  r.priority,
  r.tags,
  r.user,
  r.title,
  r.translation,
  r.original,
  r.summary,
  r.action,
]);
const reviewEndRow = 4 + Math.max(reviewRows.length, 1);
reviewsSheet.getRange(`A4:L${reviewEndRow}`).values = [reviewHeaders, ...reviewRows];
setHeader(reviewsSheet.getRange("A4:L4"));
if (reviewRows.length) setBody(reviewsSheet.getRange(`A5:L${reviewEndRow}`));
reviewsSheet.tables.add(`A4:L${reviewEndRow}`, true, "TextReviewsTable");
reviewsSheet.freezePanes.freezeRows(4);
setWidths(reviewsSheet, {
  A: 110,
  B: 105,
  C: 70,
  D: 80,
  E: 70,
  F: 270,
  G: 135,
  H: 260,
  I: 620,
  J: 560,
  K: 360,
  L: 360,
});
if (reviewRows.length) reviewsSheet.getRange(`A5:L${reviewEndRow}`).format.rowHeightPx = 100;

const translationsSheet = workbook.worksheets.add("Translations");
translationsSheet.showGridLines = false;
writeTitle(translationsSheet, "Chinese Translations", "Chinese translations are separated here for quick review.", "F");
const translationRows = enrichedReviews.map((r) => [
  r.date,
  r.rating,
  r.sentiment,
  r.title,
  r.translation,
  r.original,
]);
const translationEndRow = 4 + Math.max(translationRows.length, 1);
translationsSheet.getRange(`A4:F${translationEndRow}`).values = [
  ["Date", "Rating", "Sentiment", "Title", "Chinese Translation", "Original Review"],
  ...translationRows,
];
setHeader(translationsSheet.getRange("A4:F4"));
if (translationRows.length) setBody(translationsSheet.getRange(`A5:F${translationEndRow}`));
translationsSheet.tables.add(`A4:F${translationEndRow}`, true, "TranslationsTable");
translationsSheet.freezePanes.freezeRows(4);
setWidths(translationsSheet, { A: 105, B: 70, C: 80, D: 260, E: 620, F: 620 });
if (translationRows.length) translationsSheet.getRange(`A5:F${translationEndRow}`).format.rowHeightPx = 110;

const tagsSheet = workbook.worksheets.add("Tag Summary");
tagsSheet.showGridLines = false;
writeTitle(tagsSheet, "Tag Summary", "Counts are based on public text reviews currently visible in the US store.", "D");
const tagEndRow = 4 + Math.max(tags.length, 1);
tagsSheet.getRange(`A4:C${tagEndRow}`).values = [["Tag", "Count", "Share of Text Reviews"], ...tags];
setHeader(tagsSheet.getRange("A4:C4"));
if (tags.length) setBody(tagsSheet.getRange(`A5:C${tagEndRow}`));
tagsSheet.tables.add(`A4:C${tagEndRow}`, true, "TagSummaryTable");
tagsSheet.freezePanes.freezeRows(4);
setWidths(tagsSheet, { A: 260, B: 100, C: 160 });

const actionSheet = workbook.worksheets.add("Action Plan");
actionSheet.showGridLines = false;
writeTitle(actionSheet, "Action Plan", "Suggested prioritization from review sentiment and recurring themes.", "D");
const actionEndRow = 4 + actionPlan.length;
actionSheet.getRange(`A4:D${actionEndRow}`).values = [["Priority", "Area", "Action", "Why"], ...actionPlan];
setHeader(actionSheet.getRange("A4:D4"));
setBody(actionSheet.getRange(`A5:D${actionEndRow}`));
actionSheet.tables.add(`A4:D${actionEndRow}`, true, "ActionPlanTable");
actionSheet.freezePanes.freezeRows(4);
setWidths(actionSheet, { A: 80, B: 220, C: 560, D: 420 });

await fs.mkdir(outputDir, { recursive: true });
const overview = await workbook.inspect({
  kind: "sheet,table",
  maxChars: 4000,
  tableMaxRows: 8,
  tableMaxCols: 8,
});
console.log(overview.ndjson);
const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 50 },
  summary: "formula error scan",
});
console.log(errors.ndjson);
if (reviewRows.length) {
  await workbook.render({ sheetName: "Text Reviews", range: `A1:L${reviewEndRow}`, scale: 1, format: "png" });
}
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);

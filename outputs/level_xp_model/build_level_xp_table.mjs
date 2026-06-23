import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/admini/Documents/Pinu/outputs/level_xp_model";
const outputPath = `${outputDir}/等级经验对照表_100级.xlsx`;

const lessonXp = 10;
const averageDailyLessons = 3;
const deepDailyLessons = 6;
const maxLevel = 100;

const retentionPoints = [
  { day: 0, retention: 1 },
  { day: 1, retention: 0.5 },
  { day: 7, retention: 0.35 },
  { day: 30, retention: 0.2 },
];

const levelAnchors = [
  { level: 0, xp: 0, note: "初始等级" },
  { level: 3, xp: 30, note: "普通用户首日约到 Lv3" },
  { level: 10, xp: 210, note: "普通用户 7 日约到 Lv10" },
  { level: 25, xp: 900, note: "普通用户 30 日约到 Lv25" },
  { level: 45, xp: 2700, note: "普通用户 90 日约到 Lv45" },
  { level: 65, xp: 5400, note: "普通用户 180 日约到 Lv65" },
  { level: 100, xp: 10950, note: "普通用户 365 日约到 Lv100" },
];

function interpolateXp(level) {
  for (let i = 0; i < levelAnchors.length - 1; i += 1) {
    const start = levelAnchors[i];
    const end = levelAnchors[i + 1];
    if (level >= start.level && level <= end.level) {
      const ratio = (level - start.level) / (end.level - start.level);
      return start.xp + (end.xp - start.xp) * ratio;
    }
  }
  return levelAnchors.at(-1).xp;
}

function roundToNearestFive(value) {
  return Math.round(value / 5) * 5;
}

function buildCumulativeXp() {
  const values = [];
  for (let level = 0; level <= maxLevel; level += 1) {
    const anchor = levelAnchors.find((item) => item.level === level);
    values.push(anchor ? anchor.xp : roundToNearestFive(interpolateXp(level)));
  }
  return values;
}

function retentionAtDay(day) {
  for (let i = 0; i < retentionPoints.length - 1; i += 1) {
    const start = retentionPoints[i];
    const end = retentionPoints[i + 1];
    if (day >= start.day && day <= end.day) {
      const ratio = (day - start.day) / (end.day - start.day);
      return start.retention + (end.retention - start.retention) * ratio;
    }
  }
  return retentionPoints.at(-1).retention;
}

function cohortExpectedXp(days, dailyLessons) {
  let total = 0;
  for (let day = 1; day <= days; day += 1) {
    total += retentionAtDay(day) * dailyLessons * lessonXp;
  }
  return Math.round(total);
}

const cumulativeXp = buildCumulativeXp();
const workbook = Workbook.create();
const sheet = workbook.worksheets.add("等级经验对照表");
const params = workbook.worksheets.add("参数说明");
const retention = workbook.worksheets.add("留存节奏");

for (const ws of [sheet, params, retention]) {
  ws.showGridLines = false;
}

sheet.getRange("A1:F1").values = [[
  "等级",
  "累计 XP",
  "升级所需 XP",
  "约学习 lesson",
  "普通用户约天数",
  "深度用户约天数",
]];

const rows = cumulativeXp.map((xp, level) => {
  const nextXp = cumulativeXp[level + 1] ?? xp + 170;
  return [level, xp, nextXp - xp, null, null, null];
});
sheet.getRange(`A2:F${rows.length + 1}`).values = rows;

const firstDataRow = 2;
const lastDataRow = rows.length + 1;
sheet.getRange(`D${firstDataRow}:D${lastDataRow}`).formulas = rows.map((_, i) => [
  `=B${firstDataRow + i}/'参数说明'!$B$4`,
]);
sheet.getRange(`E${firstDataRow}:E${lastDataRow}`).formulas = rows.map((_, i) => [
  `=D${firstDataRow + i}/'参数说明'!$B$5`,
]);
sheet.getRange(`F${firstDataRow}:F${lastDataRow}`).formulas = rows.map((_, i) => [
  `=D${firstDataRow + i}/'参数说明'!$B$6`,
]);

sheet.freezePanes.freezeRows(1);
sheet.getRange("A1:F1").format.fill = { color: "#DFF5ED" };
sheet.getRange("A1:F1").format.font = { name: "Arial", size: 11, bold: true, color: "#111827" };
sheet.getRange("A1:F1").format.rowHeight = 28;
sheet.getRange("A1:F1").format.horizontalAlignment = "center";
sheet.getRange(`A2:A${lastDataRow}`).format.horizontalAlignment = "center";
sheet.getRange(`B2:F${lastDataRow}`).format.horizontalAlignment = "right";
sheet.getRange(`A1:F${lastDataRow}`).format.font = { name: "Arial", size: 11 };
sheet.getRange("A1:F1").format.font = { name: "Arial", size: 11, bold: true, color: "#111827" };
sheet.getRange(`A1:F${lastDataRow}`).format.borders = {
  insideHorizontal: { style: "thin", color: "#E5E7EB" },
  insideVertical: { style: "thin", color: "#EEF2F7" },
  bottom: { style: "thin", color: "#D1D5DB" },
};
sheet.getRange(`B2:C${lastDataRow}`).format.numberFormat = [["#,##0"]];
sheet.getRange(`D2:D${lastDataRow}`).format.numberFormat = [["#,##0.0"]];
sheet.getRange(`E2:F${lastDataRow}`).format.numberFormat = [["#,##0.0"]];
sheet.getRange("A:A").format.columnWidth = 10;
sheet.getRange("B:B").format.columnWidth = 14;
sheet.getRange("C:C").format.columnWidth = 15;
sheet.getRange("D:D").format.columnWidth = 16;
sheet.getRange("E:F").format.columnWidth = 17;

params.getRange("A1:D1").merge();
params.getRange("A1").values = [["等级经验系统参数"]];
params.getRange("A1").format.font = { name: "Arial", bold: true, size: 16, color: "#111827" };
params.getRange("A1").format.fill = { color: "#DFF5ED" };
params.getRange("A1").format.rowHeight = 28;

params.getRange("A3:B10").values = [
  ["参数", "值"],
  ["单 lesson XP", lessonXp],
  ["普通用户每日 lesson", averageDailyLessons],
  ["深度用户每日 lesson", deepDailyLessons],
  ["普通用户每日 XP", null],
  ["深度用户每日 XP", null],
  ["等级上限", maxLevel],
  ["留存标准", "次留 50%，7 留 35%，30 留 20%"],
];
params.getRange("B7:B8").formulas = [["=B4*B5"], ["=B4*B6"]];

params.getRange("A12:C19").values = [
  ["等级锚点", "累计 XP", "说明"],
  ...levelAnchors.map((item) => [`Lv${item.level}`, item.xp, item.note]),
];

params.getRange("A20:D25").values = [
  ["口径说明", "", "", ""],
  ["1", "等级节奏主要锚定留存用户的活跃日学习行为。", "", ""],
  ["2", "留存率用于估算整体注册 cohort 的期望 XP，不直接压低单个活跃用户升级体验。", "", ""],
  ["3", "30 天后的留存未提供，留存节奏 sheet 暂按 20% 延续。", "", ""],
  ["4", "如果后续实际人均 lesson 或留存变化，优先调整参数与锚点。", "", ""],
  ["5", "100 级约等于普通用户 365 天、深度用户 183 天的长期目标。", "", ""],
];

for (const range of ["A3:B10", "A12:C19"]) {
  params.getRange(range).format.borders = { preset: "all", style: "thin", color: "#E5E7EB" };
}
params.getRange("A3:B3").format.fill = { color: "#DFF5ED" };
params.getRange("A12:C12").format.fill = { color: "#DFF5ED" };
params.getRange("A3:B3").format.font = { bold: true, color: "#111827" };
params.getRange("A12:C12").format.font = { bold: true, color: "#111827" };
params.getRange("A20:D20").merge();
params.getRange("A20:D25").format.borders = {
  insideHorizontal: { style: "thin", color: "#E5E7EB" },
  top: { style: "thin", color: "#D1D5DB" },
};
params.getRange("A20").format.fill = { color: "#F3F4F6" };
params.getRange("A20").format.font = { bold: true, color: "#111827" };
params.getRange("A:D").format.font = { name: "Arial", size: 11 };
params.getRange("B4:B9").format.numberFormat = [["#,##0"], ["#,##0.0"], ["#,##0.0"], ["#,##0"], ["#,##0"], ["#,##0"]];
params.getRange("B13:B19").format.numberFormat = [["#,##0"], ["#,##0"], ["#,##0"], ["#,##0"], ["#,##0"], ["#,##0"], ["#,##0"]];
params.getRange("A:A").format.columnWidth = 18;
params.getRange("B:B").format.columnWidth = 20;
params.getRange("C:C").format.columnWidth = 34;
params.getRange("D:D").format.columnWidth = 12;

const checkpointDays = [1, 7, 30, 90, 180, 365];
retention.getRange("A1:G1").values = [[
  "周期",
  "留存率",
  "普通用户活跃 XP",
  "普通用户目标等级",
  "深度用户活跃 XP",
  "深度用户目标等级",
  "注册 cohort 期望 XP",
]];
retention.getRange(`A2:G${checkpointDays.length + 1}`).values = checkpointDays.map((day) => {
  const avgXp = day * averageDailyLessons * lessonXp;
  const deepXp = day * deepDailyLessons * lessonXp;
  return [
    `D${day}`,
    retentionAtDay(day),
    avgXp,
    "",
    deepXp,
    "",
    cohortExpectedXp(day, averageDailyLessons),
  ];
});

retention.getRange("D2:D7").formulas = checkpointDays.map((_, i) => [
  `=LOOKUP(C${2 + i},'等级经验对照表'!$B$2:$B$102,'等级经验对照表'!$A$2:$A$102)`,
]);
retention.getRange("F2:F7").formulas = checkpointDays.map((_, i) => [
  `=LOOKUP(E${2 + i},'等级经验对照表'!$B$2:$B$102,'等级经验对照表'!$A$2:$A$102)`,
]);
retention.freezePanes.freezeRows(1);
retention.getRange("A1:G1").format.fill = { color: "#DFF5ED" };
retention.getRange("A1:G1").format.font = { name: "Arial", bold: true, color: "#111827" };
retention.getRange("A1:G7").format.borders = { preset: "all", style: "thin", color: "#E5E7EB" };
retention.getRange("A:G").format.font = { name: "Arial", size: 11 };
retention.getRange("B2:B7").format.numberFormat = [["0.0%"], ["0.0%"], ["0.0%"], ["0.0%"], ["0.0%"], ["0.0%"]];
retention.getRange("C2:G7").format.numberFormat = [
  ["#,##0", "#,##0", "#,##0", "#,##0", "#,##0"],
  ["#,##0", "#,##0", "#,##0", "#,##0", "#,##0"],
  ["#,##0", "#,##0", "#,##0", "#,##0", "#,##0"],
  ["#,##0", "#,##0", "#,##0", "#,##0", "#,##0"],
  ["#,##0", "#,##0", "#,##0", "#,##0", "#,##0"],
  ["#,##0", "#,##0", "#,##0", "#,##0", "#,##0"],
];
retention.getRange("A:A").format.columnWidth = 10;
retention.getRange("B:B").format.columnWidth = 12;
retention.getRange("C:G").format.columnWidth = 18;

const tableCheck = await workbook.inspect({
  kind: "table",
  range: "等级经验对照表!A1:F102",
  include: "values,formulas",
  tableMaxRows: 18,
  tableMaxCols: 8,
});
console.log(tableCheck.ndjson);

const retentionCheck = await workbook.inspect({
  kind: "table",
  range: "留存节奏!A1:G7",
  include: "values,formulas",
  tableMaxRows: 10,
  tableMaxCols: 8,
});
console.log(retentionCheck.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const preview = await workbook.render({
  sheetName: "等级经验对照表",
  range: "A1:F38",
  scale: 2,
  format: "png",
});
await fs.writeFile(`${outputDir}/等级经验对照表_100级_preview.png`, new Uint8Array(await preview.arrayBuffer()));

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);

import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/cizzyc/Documents/Pinu/Pinu_demo/outputs/level_xp_model";
const outputPath = `${outputDir}/等级经验对照表_100级.xlsx`;

const lessonXp = 10;
const averageDailyLessons = 3;
const deepDailyLessons = 6;
const maxLevel = 100;

const colors = {
  green: "#DFF5ED",
  greenDark: "#0F766E",
  blue: "#DBEAFE",
  yellow: "#FEF3C7",
  orange: "#FFEDD5",
  gray: "#F3F4F6",
  red: "#FEE2E2",
  border: "#E5E7EB",
  text: "#111827",
};

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

const xpRules = [
  ["基础难度题型", 10, "普通学习、基础选择、基础句子练习", "是", "是", "第一版 XP 最小正反馈单位"],
  ["进阶难度题型", 15, "口语、听力、组合表达、较高认知负荷题", "是", "是", "强化 Pinu 口语/听力差异化"],
  ["挑战类玩法", 30, "限时挑战、综合挑战、阶段挑战", "是", "是", "低频高门槛，不让单次挑战决定榜单"],
  ["复习", 5, "巩固旧内容", "是，受每日上限", "是，受每日上限", "防止简单复习成为刷分主路径"],
];

const reviewLimitRules = [
  ["复习单次 XP", "5 XP"],
  ["每日可计入周榜的复习 XP 上限", "30 XP"],
  ["每日可计入累计等级的复习 XP 上限", "30 XP"],
  ["超出上限", "可继续复习，但不再获得 XP；只保留 Mastery/复习完成反馈"],
  ["到期复习优先", "到期复习给 XP，非到期重复复习不给或递减"],
];

const dailyCapRules = [
  [0, 150, 1, "普通有效学习区"],
  [151, 300, 0.5, "高投入区，开始防刷"],
  [301, null, 0.2, "极高投入区，防止刷榜拉爆"],
];

const newbieRewards = [
  ["第 1 名", "新星冠军徽章"],
  ["前 3 名", "新手 Top 3 标记"],
  ["前 50%", "新手优秀学习者"],
  ["完成 3 次有效学习", "启航徽章"],
  ["完成首次口语", "首次开口徽章"],
];

const weeklyRewards = [
  ["第 1 名", "本周学习冠军徽章"],
  ["前 3 名", "本周 Top 3 称号"],
  ["前 30%", "本周优秀学习者标记"],
  ["达成个人周目标", "周目标完成徽章进度"],
  ["连续 2 周参与", "连续参赛进度"],
];

const deferredSystems = [
  ["每日任务", "暂不做，或只做展示型目标"],
  ["倍卡", "暂不做"],
  ["Coins", "暂不做"],
  ["任务 XP", "不直接发"],
  ["倍卡 XP", "后续上线时不直接进入累计等级，或限额计入"],
  ["月度挑战", "后续优先按完成任务数，不按获得 XP 数"],
];

const pinuDataInputs = [
  ["近 7 日人均学习 level 数", 2.8594707651465887, "level/学习用户/日", "pinu人均学习level数，2026-06-17 至 2026-06-23"],
  ["近 15 日人均学习 level 数", 3.1129283152672342, "level/学习用户/日", "pinu人均学习level数，2026-06-09 至 2026-06-23"],
  ["近 7 日平均学习人数", 968.8571428571429, "人/日", "pinu人均学习level数，2026-06-17 至 2026-06-23"],
  ["近 15 日人均打开次数", 2.224669987339493, "次/人/日", "pinu核心数据_人均打开次数，2026-06-09 至 2026-06-23"],
  ["近 15 日人均时长", 11.050315605723698, "分钟/人/日", "pinu核心数据_人均时长，2026-06-09 至 2026-06-23"],
  ["近 7 日单日时长低于 10 分钟用户占比", 0.63, "%", "pinu核心数据_时长分布，近 7 日 [0,5)+[5,10) UV 占比"],
  ["成熟样本次留", 0.4636, "%", "pinu核心数据_APP留存，剔除未成熟 0 值"],
  ["成熟样本 7 留", 0.3619, "%", "pinu核心数据_APP留存，剔除未成熟 0 值"],
];

const inflationScenarios = [
  ["裸学习", 0],
  ["轻度膨胀", 0.25],
  ["中度膨胀", 0.5],
  ["重度膨胀", 0.8],
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

function levelStage(level) {
  if (level <= 10) return "新手反馈期";
  if (level <= 25) return "习惯建立期";
  if (level <= 45) return "稳定成长区";
  if (level <= 65) return "长期投入区";
  return "长期身份区";
}

function applySheetBase(ws) {
  ws.showGridLines = false;
  const usedRange = ws.getUsedRange();
  if (usedRange) {
    usedRange.format.font = { name: "Arial", size: 11, color: colors.text };
  }
}

function title(ws, range, text, fill = colors.green) {
  ws.getRange(range).merge();
  const cell = ws.getRange(range.split(":")[0]);
  cell.values = [[text]];
  cell.format.font = { name: "Arial", bold: true, size: 16, color: colors.text };
  cell.format.fill = { color: fill };
  cell.format.rowHeight = 30;
  cell.format.verticalAlignment = "center";
}

function section(ws, range, text, fill = colors.gray) {
  ws.getRange(range).merge();
  const cell = ws.getRange(range.split(":")[0]);
  cell.values = [[text]];
  cell.format.font = { name: "Arial", bold: true, size: 12, color: colors.text };
  cell.format.fill = { color: fill };
  cell.format.rowHeight = 24;
}

function styleTable(ws, range, headerRange) {
  ws.getRange(range).format.borders = { preset: "all", style: "thin", color: colors.border };
  ws.getRange(range).format.font = { name: "Arial", size: 11, color: colors.text };
  ws.getRange(headerRange).format.fill = { color: colors.green };
  ws.getRange(headerRange).format.font = { name: "Arial", bold: true, size: 11, color: colors.text };
  ws.getRange(headerRange).format.horizontalAlignment = "center";
  ws.getRange(range).format.verticalAlignment = "center";
}

const cumulativeXp = buildCumulativeXp();
const workbook = Workbook.create();
const sheet = workbook.worksheets.add("等级经验对照表");
const params = workbook.worksheets.add("参数说明");
const retention = workbook.worksheets.add("留存节奏");
const curve = workbook.worksheets.add("等级成长曲线");
const xpSheet = workbook.worksheets.add("第一版XP规则");
const rewardSheet = workbook.worksheets.add("排行榜奖励");
const modelSheet = workbook.worksheets.add("数据校准与XP膨胀模型");

for (const ws of [sheet, params, retention, curve, xpSheet, rewardSheet, modelSheet]) {
  ws.showGridLines = false;
}

// 等级经验对照表
sheet.getRange("A1:F1").values = [[
  "等级",
  "累计 XP",
  "升级所需 XP",
  "约学习 level",
  "普通用户约天数",
  "深度用户约天数",
]];

const rows = cumulativeXp.map((xp, level) => {
  const nextXp = cumulativeXp[level + 1] ?? null;
  return [level, xp, nextXp === null ? null : nextXp - xp, null, null, null];
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
sheet.getRange("A1:F1").format.fill = { color: colors.green };
sheet.getRange("A1:F1").format.font = { name: "Arial", size: 11, bold: true, color: colors.text };
sheet.getRange("A1:F1").format.rowHeight = 28;
sheet.getRange("A1:F1").format.horizontalAlignment = "center";
sheet.getRange(`A2:A${lastDataRow}`).format.horizontalAlignment = "center";
sheet.getRange(`B2:F${lastDataRow}`).format.horizontalAlignment = "right";
sheet.getRange(`A1:F${lastDataRow}`).format.font = { name: "Arial", size: 11 };
sheet.getRange("A1:F1").format.font = { name: "Arial", size: 11, bold: true, color: colors.text };
sheet.getRange(`A1:F${lastDataRow}`).format.borders = {
  insideHorizontal: { style: "thin", color: colors.border },
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

// 参数说明
title(params, "A1:D1", "等级经验系统参数");
params.getRange("A3:B12").values = [
  ["参数", "值"],
  ["基础 level XP", lessonXp],
  ["普通用户每日 level", averageDailyLessons],
  ["深度用户每日 level", deepDailyLessons],
  ["普通用户每日基础 XP", null],
  ["深度用户每日基础 XP", null],
  ["等级上限", maxLevel],
  ["复习单次 XP", 5],
  ["复习每日计入 XP 上限", 30],
  ["每日有效 XP 软上限", "0-150 100%，151-300 50%，300+ 20%"],
];
params.getRange("B7:B8").formulas = [["=B4*B5"], ["=B4*B6"]];
params.getRange("A14:C21").values = [
  ["等级锚点", "累计 XP", "说明"],
  ...levelAnchors.map((item) => [`Lv${item.level}`, item.xp, item.note]),
];
params.getRange("A23:D29").values = [
  ["口径说明", "", "", ""],
  ["1", "当前等级曲线仍锚定基础学习 XP：1 level = 10 XP，普通用户约 3 level/日。", "", ""],
  ["2", "排行榜使用本周有效 XP，每周清零；累计 XP 用于长期等级身份。", "", ""],
  ["3", "第一版不引入 Coins，排行榜奖励先用徽章、称号、头像框试用和展示标记。", "", ""],
  ["4", "任务和倍卡暂不进入第一版；后续上线时优先不直接发大量 XP。", "", ""],
  ["5", "复习给低 XP 且每日限量，避免旧内容成为刷榜最优路径。", "", ""],
  ["6", "如果后续实际 XP 膨胀超过 25%，优先调中后段等级门槛或限制奖励 XP 入账。", "", ""],
];
styleTable(params, "A3:B12", "A3:B3");
styleTable(params, "A14:C21", "A14:C14");
params.getRange("A23:D23").merge();
params.getRange("A23:D29").format.borders = {
  insideHorizontal: { style: "thin", color: colors.border },
  top: { style: "thin", color: "#D1D5DB" },
};
params.getRange("A23").format.fill = { color: colors.gray };
params.getRange("A23").format.font = { bold: true, color: colors.text };
params.getRange("A:D").format.font = { name: "Arial", size: 11 };
params.getRange("B4:B11").format.numberFormat = [["#,##0"], ["#,##0.0"], ["#,##0.0"], ["#,##0"], ["#,##0"], ["#,##0"], ["#,##0"], ["#,##0"]];
params.getRange("B15:B21").format.numberFormat = [["#,##0"], ["#,##0"], ["#,##0"], ["#,##0"], ["#,##0"], ["#,##0"], ["#,##0"]];
params.getRange("A:A").format.columnWidth = 22;
params.getRange("B:B").format.columnWidth = 22;
params.getRange("C:C").format.columnWidth = 48;
params.getRange("D:D").format.columnWidth = 12;

// 留存节奏
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
styleTable(retention, "A1:G7", "A1:G1");
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

// 等级成长曲线
title(curve, "A1:J1", "等级成长曲线：基础 XP 曲线与阶段判断");
curve.getRange("A3:J3").values = [[
  "等级",
  "累计 XP",
  "升级所需 XP",
  "普通用户约天数",
  "深度用户约天数",
  "每级普通用户所需天数",
  "升级 XP 变化",
  "升级 XP 变化率",
  "阶段",
  "曲线评价",
]];
curve.getRange(`A4:J${maxLevel + 4}`).values = cumulativeXp.map((xp, level) => [
  level,
  xp,
  level < maxLevel ? null : null,
  null,
  null,
  null,
  null,
  null,
  levelStage(level),
  "",
]);
curve.getRange(`C4:C${maxLevel + 4}`).formulas = cumulativeXp.map((_, level) => [
  level < maxLevel ? `='等级经验对照表'!C${level + 2}` : "",
]);
curve.getRange(`D4:D${maxLevel + 4}`).formulas = cumulativeXp.map((_, level) => [
  `='等级经验对照表'!E${level + 2}`,
]);
curve.getRange(`E4:E${maxLevel + 4}`).formulas = cumulativeXp.map((_, level) => [
  `='等级经验对照表'!F${level + 2}`,
]);
curve.getRange(`F4:F${maxLevel + 4}`).formulas = cumulativeXp.map((_, level) => [
  level < maxLevel ? `=C${level + 4}/'参数说明'!$B$7` : "",
]);
curve.getRange(`G4:G${maxLevel + 4}`).formulas = cumulativeXp.map((_, level) => [
  level === 0 || level === maxLevel ? "" : `=C${level + 4}-C${level + 3}`,
]);
curve.getRange(`H4:H${maxLevel + 4}`).formulas = cumulativeXp.map((_, level) => [
  level === 0 || level === maxLevel ? "" : `=IF(C${level + 3}=0,"",C${level + 4}/C${level + 3}-1)`,
]);
curve.getRange(`J4:J${maxLevel + 4}`).formulas = cumulativeXp.map((_, level) => {
  const row = level + 4;
  if (level === maxLevel) return ['="上限等级"'];
  if (level === 0) return ['="初始"'];
  return [`=IF(G${row}<0,"XP 回落",IF(H${row}>0.5,"跳变较大","平稳"))`];
});
styleTable(curve, `A3:J${maxLevel + 4}`, "A3:J3");
curve.freezePanes.freezeRows(3);
curve.getRange("A:A").format.columnWidth = 8;
curve.getRange("B:C").format.columnWidth = 14;
curve.getRange("D:F").format.columnWidth = 18;
curve.getRange("G:H").format.columnWidth = 16;
curve.getRange("I:J").format.columnWidth = 16;
curve.getRange(`B4:C${maxLevel + 4}`).format.numberFormat = [["#,##0"]];
curve.getRange(`D4:F${maxLevel + 4}`).format.numberFormat = [["#,##0.0"]];
curve.getRange(`G4:G${maxLevel + 4}`).format.numberFormat = [["#,##0"]];
curve.getRange(`H4:H${maxLevel + 4}`).format.numberFormat = [["0.0%"]];
section(curve, "L3:S3", "曲线读法", colors.blue);
curve.getRange("L4:S10").values = [
  ["图表说明", "当前版本保留公式化曲线数据源，便于后续在 Excel 中插入折线图。", "", "", "", "", "", ""],
  ["累计 XP 曲线", "使用 A3:B104，观察长期等级成长速度。", "", "", "", "", "", ""],
  ["升级所需 XP 曲线", "使用 A3:C104，观察每级门槛是否平滑。", "", "", "", "", "", ""],
  ["普通用户天数曲线", "使用 A3:D104，观察 D1/D7/D30/D90/D180/D365 节点。", "", "", "", "", "", ""],
  ["当前判断", "原表是锚点驱动的分段阶梯曲线，MVP 可用；正式上线前可进一步平滑。", "", "", "", "", "", ""],
  ["注意", "Lv100 是上限，因此主表 Lv100 的升级所需 XP 留空。", "", "", "", "", "", ""],
  ["后续", "若任务/倍卡导致 XP 膨胀超过 25%，优先调中后段门槛。", "", "", "", "", "", ""],
];
curve.getRange("L4:S10").format.borders = { preset: "all", style: "thin", color: colors.border };
curve.getRange("L4:S10").format.wrapText = true;

// 第一版 XP 规则
title(xpSheet, "A1:F1", "第一版 XP 规则：4 档数值、复习限量、每日软上限");
section(xpSheet, "A3:F3", "XP 四档规则", colors.green);
xpSheet.getRange("A4:F8").values = [
  ["行为类型", "XP", "说明", "计入累计等级 XP", "计入周榜 XP", "设计理由"],
  ...xpRules,
];
styleTable(xpSheet, "A4:F8", "A4:F4");
section(xpSheet, "A10:B10", "复习 XP 限制", colors.yellow);
xpSheet.getRange("A11:B16").values = [
  ["规则", "建议"],
  ...reviewLimitRules,
];
styleTable(xpSheet, "A11:B16", "A11:B11");
section(xpSheet, "D10:F10", "每日有效 XP 软上限", colors.orange);
xpSheet.getRange("D11:F14").values = [
  ["当日有效 XP", "计入比例", "说明"],
  ["0-150 XP", 1, "100% 计入"],
  ["151-300 XP", 0.5, "超出部分 50% 计入"],
  ["300+ XP", 0.2, "超出部分 20% 计入"],
];
styleTable(xpSheet, "D11:F14", "D11:F11");
xpSheet.getRange("E12:E14").format.numberFormat = [["0%"], ["0%"], ["0%"]];
section(xpSheet, "A18:F18", "账本口径", colors.gray);
xpSheet.getRange("A19:F23").values = [
  ["XP 账户", "用途", "清零", "来源", "第一版处理", "备注"],
  ["累计等级 XP", "等级与长期身份", "不清零", "基础/进阶/挑战/限量复习", "启用", "不使用 Coins、不让倍卡膨胀等级"],
  ["周榜 XP", "本周学习榜排名", "每周清零", "同一批有效学习事件", "启用", "受每日软上限"],
  ["新手榜 XP", "同届学习榜", "新手期结束归档", "新手期有效学习事件", "启用", "新手奖励不污染正式榜"],
  ["奖励/倍卡 XP", "未来运营刺激", "按活动周期", "任务、倍卡、赛季", "预留", "后续优先限额或不进等级"],
];
styleTable(xpSheet, "A19:F23", "A19:F19");
xpSheet.getRange("A:F").format.columnWidth = 18;
xpSheet.getRange("C:C").format.columnWidth = 34;
xpSheet.getRange("F:F").format.columnWidth = 34;
xpSheet.getRange("A4:F23").format.wrapText = true;

// 排行榜奖励
title(rewardSheet, "A1:E1", "排行榜奖励：第一版不引入 Coins");
section(rewardSheet, "A3:B3", "新手榜奖励", colors.green);
rewardSheet.getRange("A4:B9").values = [["条件", "奖励"], ...newbieRewards];
styleTable(rewardSheet, "A4:B9", "A4:B4");
section(rewardSheet, "D3:E3", "正式周榜奖励", colors.blue);
rewardSheet.getRange("D4:E9").values = [["条件", "奖励"], ...weeklyRewards];
styleTable(rewardSheet, "D4:E9", "D4:E4");
section(rewardSheet, "A11:E11", "暂不做的系统与预留规则", colors.gray);
rewardSheet.getRange("A12:E18").values = [
  ["系统", "第一版处理", "原因", "后续原则", "是否影响当前 XP"],
  ["Coins", "暂不做", "无消耗口会通胀，解释成本高", "有商店/资产消耗后再上", "否"],
  ["商店/道具", "暂不做", "第一版目标是验证 XP + 排行榜", "与头像框、装扮、赛季资产一起规划", "否"],
  ["每日任务", "暂不做或只做展示型目标", "避免用户过早形成刷任务=进步", "后续按完成任务数，不按获得 XP 数", "否"],
  ["倍卡", "暂不做", "当前需要先验证基础 XP", "后续额外 XP 限额或不进等级", "否"],
  ["付费兑换", "暂不做", "不能污染排行榜公平", "付费买表达/效率，不买排名", "否"],
  ["月度挑战", "暂不做", "任务骨架未建", "完成 N 个任务，而非获得 N XP", "否"],
];
styleTable(rewardSheet, "A12:E18", "A12:E12");
section(rewardSheet, "A20:E20", "奖励设计原则", colors.yellow);
rewardSheet.getRange("A21:E25").values = [
  ["原则", "说明", "", "", ""],
  ["轻奖励", "第一版用徽章、称号、头像框试用、展示标记和结算动画，不发 Coins。", "", "", ""],
  ["不卖排名", "任何付费、道具、兑换都不能直接影响周榜排名。", "", "", ""],
  ["不奖励学习优势", "不奖励课程跳过、免练习通关、答案权益或 Mastery。", "", "", ""],
  ["先验证行为", "先观察 D1/D7、周内学习天数、口语/听力占比、复习刷满率。", "", "", ""],
];
rewardSheet.getRange("A21:E25").format.borders = { preset: "all", style: "thin", color: colors.border };
rewardSheet.getRange("A:E").format.columnWidth = 22;
rewardSheet.getRange("B:B").format.columnWidth = 28;
rewardSheet.getRange("C:D").format.columnWidth = 32;
rewardSheet.getRange("A12:E25").format.wrapText = true;

// 数据校准与 XP 膨胀模型
title(modelSheet, "A1:H1", "数据校准与 XP 膨胀模型：用 Pinu 真实数据约束第一版 XP");
section(modelSheet, "A3:D3", "Pinu 真实数据输入", colors.green);
modelSheet.getRange("A4:D12").values = [
  ["指标", "值", "单位", "来源"],
  ...pinuDataInputs,
];
styleTable(modelSheet, "A4:D12", "A4:D4");
modelSheet.getRange("B5:B9").format.numberFormat = [["0.00"], ["0.00"], ["#,##0"], ["0.00"], ["0.00"]];
modelSheet.getRange("B10:B12").format.numberFormat = [["0.0%"], ["0.0%"], ["0.0%"]];
modelSheet.getRange("A:D").format.columnWidth = 24;
modelSheet.getRange("D:D").format.columnWidth = 64;
modelSheet.getRange("A4:D12").format.wrapText = true;

section(modelSheet, "F3:H3", "基础 XP 校准", colors.blue);
modelSheet.getRange("F4:H8").values = [
  ["项目", "公式/值", "结论"],
  ["近 7 日基础 XP/日", null, "接近原假设 30 XP/日"],
  ["近 15 日基础 XP/日", null, "与 3 level/日假设一致"],
  ["近 7 日基础 XP/周", null, "连续活跃用户约 200 XP/周"],
  ["原表 Lv100 XP", levelAnchors.at(-1).xp, "裸学习约 365 天"],
];
modelSheet.getRange("G5:G7").formulas = [
  ["=B5*'参数说明'!$B$4"],
  ["=B6*'参数说明'!$B$4"],
  ["=G5*7"],
];
styleTable(modelSheet, "F4:H8", "F4:H4");
modelSheet.getRange("G5:G8").format.numberFormat = [["#,##0.0"], ["#,##0.0"], ["#,##0.0"], ["#,##0"]];
modelSheet.getRange("F:F").format.columnWidth = 24;
modelSheet.getRange("G:G").format.columnWidth = 18;
modelSheet.getRange("H:H").format.columnWidth = 34;
modelSheet.getRange("F4:H8").format.wrapText = true;

section(modelSheet, "A14:F14", "XP 膨胀情景：如果任务、倍卡、活动全部计入等级，Lv100 会提前打穿", colors.orange);
modelSheet.getRange("A15:F19").values = [
  ["情景", "XP 膨胀率", "日均 XP", "达到 Lv100 天数", "比 365 天提前", "设计判断"],
  ...inflationScenarios.map(([name, rate]) => [name, rate, null, null, null, ""]),
];
modelSheet.getRange("C16:C19").formulas = inflationScenarios.map((_, i) => [`='参数说明'!$B$7*(1+B${16 + i})`]);
modelSheet.getRange("D16:D19").formulas = inflationScenarios.map((_, i) => [`='参数说明'!$B$21/C${16 + i}`]);
modelSheet.getRange("E16:E19").formulas = inflationScenarios.map((_, i) => [`=365-D${16 + i}`]);
modelSheet.getRange("F16:F19").values = [
  ["可接受，作为裸学习基准"],
  ["可接受但需观察"],
  ["等级曲线会明显偏快"],
  ["不建议，长期身份被冲穿"],
];
styleTable(modelSheet, "A15:F19", "A15:F15");
modelSheet.getRange("B16:B19").format.numberFormat = [["0%"], ["0%"], ["0%"], ["0%"]];
modelSheet.getRange("C16:E19").format.numberFormat = [["#,##0.0"], ["#,##0.0"], ["#,##0.0"], ["#,##0.0"]];
section(modelSheet, "H14:H14", "结论");
modelSheet.getRange("H15:H19").values = [
  ["膨胀结论"],
  ["0%：Lv100 约 365 天"],
  ["25%：约 292 天，可观察"],
  ["50%：约 243 天，偏快"],
  ["80%：约 203 天，不建议"],
];
modelSheet.getRange("H15:H19").format.borders = { preset: "all", style: "thin", color: colors.border };
modelSheet.getRange("H15").format.fill = { color: colors.green };
modelSheet.getRange("H15").format.font = { bold: true, color: colors.text };
modelSheet.getRange("H:H").format.columnWidth = 24;
modelSheet.getRange("H:H").format.columnWidth = 34;
modelSheet.getRange("H15:H19").format.wrapText = true;

section(modelSheet, "A22:H22", "多邻国截图观点与 Pinu 设计响应", colors.yellow);
modelSheet.getRange("A23:H28").values = [
  ["观点", "多邻国经验", "Pinu 第一版响应", "", "", "", "", ""],
  ["XP 与学习质量有矛盾", "最快刷 XP 的行为不一定学习价值最高", "复习 5 XP 且每日限量；挑战 30 XP 但低频；监控口语/听力占比", "", "", "", "", ""],
  ["内部用 TSLW 衡量质量", "看有效学习时长，而不是 App 总时长或纯 XP", "新增 TSLW/有效学习监控，不把 XP 当唯一北极星", "", "", "", "", ""],
  ["月度挑战从 XP 改为任务", "避免 XP 通胀和刷分", "后续月度挑战按完成 N 个任务，不按获得 N XP", "", "", "", "", ""],
  ["10 XP 是直觉单位", "整数、倍数友好、每日目标低门槛", "保留 10/15/30/5 四档，避免复杂小数", "", "", "", "", ""],
  ["XP 是血液，任务是骨架", "只有 XP 会诱导刷分，只有任务缺即时反馈", "第一版先做 XP + 榜，任务预留但不发大量 XP", "", "", "", "", ""],
];
modelSheet.getRange("A23:H28").format.borders = { preset: "all", style: "thin", color: colors.border };
modelSheet.getRange("A23:H23").format.fill = { color: colors.green };
modelSheet.getRange("A23:H23").format.font = { bold: true, color: colors.text };
modelSheet.getRange("A23:H28").format.wrapText = true;
modelSheet.getRange("A:A").format.columnWidth = 26;
modelSheet.getRange("B:C").format.columnWidth = 38;
modelSheet.getRange("D:H").format.columnWidth = 12;

section(modelSheet, "A31:H31", "上线后监控指标", colors.gray);
modelSheet.getRange("A32:H38").values = [
  ["指标", "要回答的问题", "预警方向", "", "", "", "", ""],
  ["人均 XP/天", "是否从约 30 提升到合理区间", "异常飙升说明刷分或规则过松", "", "", "", "", ""],
  ["进阶题型 XP 占比", "口语/听力是否被 XP 促进", "占比不升说明 XP 未强化差异化", "", "", "", "", ""],
  ["复习 XP 刷满率", "复习上限是否合理", "大量用户刷满说明复习仍是刷分入口", "", "", "", "", ""],
  ["排行榜前 10 XP 来源", "头部是否主要来自有效学习", "重复复习/挑战占比过高需降权", "", "", "", "", ""],
  ["D1/D7、周内学习天数", "排行榜是否真的拉动留存", "只拉 XP 不拉留存说明激励无效", "", "", "", "", ""],
  ["TSLW/有效学习时长", "XP 是否带来认真学习", "XP 上升但 TSLW 不升说明质量风险", "", "", "", "", ""],
];
modelSheet.getRange("A32:H38").format.borders = { preset: "all", style: "thin", color: colors.border };
modelSheet.getRange("A32:H32").format.fill = { color: colors.green };
modelSheet.getRange("A32:H32").format.font = { bold: true, color: colors.text };
modelSheet.getRange("A32:H38").format.wrapText = true;

for (const ws of [params, curve, xpSheet, rewardSheet, modelSheet]) {
  const usedRange = ws.getUsedRange();
  if (usedRange) {
    usedRange.format.font = { name: "Arial", size: 11, color: colors.text };
  }
}

// Compact verification
const tableCheck = await workbook.inspect({
  kind: "table",
  range: "第一版XP规则!A1:F23",
  include: "values,formulas",
  tableMaxRows: 24,
  tableMaxCols: 8,
});
console.log(tableCheck.ndjson);

const modelCheck = await workbook.inspect({
  kind: "table",
  range: "数据校准与XP膨胀模型!A14:F19",
  include: "values,formulas",
  tableMaxRows: 8,
  tableMaxCols: 8,
});
console.log(modelCheck.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

await fs.mkdir(outputDir, { recursive: true });

for (const [sheetName, fileName, range] of [
  ["等级经验对照表", "等级经验对照表_100级_preview.png", "A1:F38"],
  ["第一版XP规则", "第一版XP规则_preview.png", "A1:F23"],
  ["数据校准与XP膨胀模型", "数据校准与XP膨胀模型_preview.png", "A1:H38"],
]) {
  const preview = await workbook.render({
    sheetName,
    range,
    scale: 2,
    format: "png",
  });
  await fs.writeFile(`${outputDir}/${fileName}`, new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);

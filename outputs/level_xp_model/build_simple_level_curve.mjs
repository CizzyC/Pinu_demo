import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/cizzyc/Documents/Pinu/Pinu_demo/outputs/level_xp_model";
const outputPath = `${outputDir}/Pinu等级经验曲线_简版.xlsx`;

const colors = {
  green: "#DFF5ED",
  blue: "#DBEAFE",
  gray: "#F3F4F6",
  border: "#E5E7EB",
  text: "#111827",
};

const maxLevel = 100;
const levelAnchors = [
  [0, 0, "初始等级"],
  [3, 30, "首日约到 Lv3"],
  [10, 225, "7 日约到 Lv10"],
  [25, 1150, "30 日约到 Lv25"],
  [37, 2650, "60 日约到 Lv37"],
  [45, 4450, "90 日约到 Lv45"],
  [65, 10995, "180 日约到 Lv65"],
  [100, 27600, "365 日约到 Lv100"],
];

const dailyXpAnchors = [
  [1, 30, "首日约 3 个基础学习行为"],
  [7, 35, "首周形成轻量学习节奏"],
  [30, 45, "30 日后课程完成数和进阶题占比提升"],
  [60, 55, "两个月后学习习惯更稳定"],
  [90, 65, "季度留存用户更愿意做口语/听力"],
  [180, 80, "半年留存用户学习深度继续增加"],
  [365, 100, "年度留存用户进入稳定高频学习"],
];

const levelAnchorEndRow = 12 + levelAnchors.length;
const dailyAnchorStartRow = levelAnchorEndRow + 3;
const dailyAnchorEndRow = dailyAnchorStartRow + dailyXpAnchors.length;
const notesStartRow = dailyAnchorEndRow + 3;

function styleTitle(ws, range, text) {
  ws.getRange(range).merge();
  const cell = ws.getRange(range.split(":")[0]);
  cell.values = [[text]];
  cell.format.fill = { color: colors.green };
  cell.format.font = { name: "Arial", size: 16, bold: true, color: colors.text };
  cell.format.rowHeight = 30;
}

function styleTable(ws, range, headerRange) {
  ws.getRange(range).format.borders = { preset: "all", style: "thin", color: colors.border };
  ws.getRange(range).format.font = { name: "Arial", size: 11, color: colors.text };
  ws.getRange(headerRange).format.fill = { color: colors.green };
  ws.getRange(headerRange).format.font = { name: "Arial", size: 11, bold: true, color: colors.text };
  ws.getRange(headerRange).format.horizontalAlignment = "center";
}

const wb = Workbook.create();
const table = wb.worksheets.add("等级-经验对照");
const curve = wb.worksheets.add("日期-等级经验曲线");
const params = wb.worksheets.add("参数说明");

for (const ws of [table, curve, params]) {
  ws.showGridLines = false;
}

// 参数说明
styleTitle(params, "A1:D1", "参数说明");
params.getRange("A3:B9").values = [
  ["参数", "值"],
  ["等级上限", maxLevel],
  ["基础题型 XP", 10],
  ["普通用户每日 level", 3],
  ["普通用户每日 XP", null],
  ["新增日期", new Date("2026-06-24T00:00:00")],
  ["曲线天数", 365],
];
params.getRange("B7").formulas = [["=B5*B6"]];
styleTable(params, "A3:B9", "A3:B3");
params.getRange("B8").setNumberFormat("yyyy-mm-dd");
params.getRange("B4:B7").format.numberFormat = [["#,##0"], ["#,##0"], ["#,##0.0"], ["#,##0"]];
params.getRange("B9").format.numberFormat = [["#,##0"]];

params.getRange(`A12:C${levelAnchorEndRow}`).values = [
  ["等级锚点", "累计经验", "说明"],
  ...levelAnchors.map(([level, xp, note]) => [level, xp, note]),
];
styleTable(params, `A12:C${levelAnchorEndRow}`, "A12:C12");
params.getRange(`A12:B${levelAnchorEndRow}`).format.numberFormat = [["#,##0"]];

params.getRange(`A${dailyAnchorStartRow}:C${dailyAnchorEndRow}`).values = [
  ["每日 XP 留存天数", "当日 XP", "说明"],
  ...dailyXpAnchors.map(([day, xp, note]) => [day, xp, note]),
];
styleTable(params, `A${dailyAnchorStartRow}:C${dailyAnchorEndRow}`, `A${dailyAnchorStartRow}:C${dailyAnchorStartRow}`);
params.getRange(`A${dailyAnchorStartRow + 1}:A${dailyAnchorEndRow}`).setNumberFormat('"D"0');
params.getRange(`B${dailyAnchorStartRow + 1}:B${dailyAnchorEndRow}`).format.numberFormat = [["#,##0"]];
params.getRange(`C${dailyAnchorStartRow}:C${dailyAnchorEndRow}`).format.wrapText = true;

params.getRange(`A${notesStartRow}:D${notesStartRow + 6}`).values = [
  ["说明", "", "", ""],
  ["1", "修改 B4:B9、等级锚点或每日 XP 留存曲线锚点，会影响前两张表。", "", ""],
  ["2", "等级页通过等级锚点线性插值生成累计经验，并四舍五入到 5 的倍数。", "", ""],
  ["3", "曲线页按新增日期起算，当日 XP 随留存天数分段增长，累计经验为每日 XP 累加。", "", ""],
  ["4", "多邻国用 XP 做即时反馈，但长期成长会受学习习惯、任务、活动影响；Pinu 第一版先只建课程 XP 地基。", "", ""],
  ["5", "第一版暂不引入 Coins、任务 XP、倍卡 XP，避免早期经济系统过重。", "", ""],
  ["6", "如未来任务、倍卡或活动使 XP 长期膨胀，应优先上调中后段等级锚点。", "", ""],
];
params.getRange(`A${notesStartRow}:D${notesStartRow}`).merge();
for (let row = notesStartRow + 1; row <= notesStartRow + 6; row += 1) {
  params.getRange(`B${row}:D${row}`).merge();
}
params.getRange(`A${notesStartRow}`).format.fill = { color: colors.gray };
params.getRange(`A${notesStartRow}`).format.font = { name: "Arial", bold: true, color: colors.text };
params.getRange(`A${notesStartRow}:D${notesStartRow + 6}`).format.borders = { preset: "all", style: "thin", color: colors.border };
params.getRange(`A${notesStartRow}:D${notesStartRow + 6}`).format.wrapText = true;
params.getRange(`A${notesStartRow + 1}:A${notesStartRow + 6}`).format.columnWidth = 10;
params.getRange("A:A").format.columnWidth = 18;
params.getRange("B:B").format.columnWidth = 18;
params.getRange("C:C").format.columnWidth = 38;
params.getRange("D:D").format.columnWidth = 16;

// 等级-经验对照
styleTitle(table, "A1:C1", "等级-经验对照");
table.getRange("A3:C3").values = [["等级", "累计经验", "下一级经验"]];
const levelRows = Array.from({ length: maxLevel }, (_, i) => [i + 1, null, null]);
table.getRange("A4:C103").values = levelRows;
table.getRange("B4:B103").formulas = levelRows.map((_, i) => {
  const row = i + 4;
  return [`=ROUND(IF(A${row}<='参数说明'!$A$14,FORECAST(A${row},'参数说明'!$B$13:$B$14,'参数说明'!$A$13:$A$14),IF(A${row}<='参数说明'!$A$15,FORECAST(A${row},'参数说明'!$B$14:$B$15,'参数说明'!$A$14:$A$15),IF(A${row}<='参数说明'!$A$16,FORECAST(A${row},'参数说明'!$B$15:$B$16,'参数说明'!$A$15:$A$16),IF(A${row}<='参数说明'!$A$17,FORECAST(A${row},'参数说明'!$B$16:$B$17,'参数说明'!$A$16:$A$17),IF(A${row}<='参数说明'!$A$18,FORECAST(A${row},'参数说明'!$B$17:$B$18,'参数说明'!$A$17:$A$18),IF(A${row}<='参数说明'!$A$19,FORECAST(A${row},'参数说明'!$B$18:$B$19,'参数说明'!$A$18:$A$19),FORECAST(A${row},'参数说明'!$B$19:$B$20,'参数说明'!$A$19:$A$20)))))))/5,0)*5`];
});
table.getRange("C4:C103").formulas = levelRows.map((_, i) => {
  const row = i + 4;
  return i === maxLevel - 1 ? ['="Max"'] : [`=B${row + 1}-B${row}`];
});
styleTable(table, "A3:C103", "A3:C3");
table.freezePanes.freezeRows(3);
table.getRange("A:A").format.columnWidth = 12;
table.getRange("B:C").format.columnWidth = 16;
table.getRange("A4:A103").format.numberFormat = [["#,##0"]];
table.getRange("B4:B103").format.numberFormat = [["#,##0"]];
table.getRange("C4:C102").format.numberFormat = [["#,##0"]];

// 日期-等级经验曲线
styleTitle(curve, "A1:F1", "日期-等级经验曲线");
curve.getRange("A3:F3").values = [["新增日期", "相对天数", "当日 XP", "累计经验", "等级", "关键节点"]];
const curveRows = Array.from({ length: 366 }, () => [null, null, null, null, null]);
curve.getRange("A4:F369").values = curveRows.map(() => [null, null, null, null, null, null]);
curve.getRange("A4:A369").formulas = curveRows.map((_, i) => [`='参数说明'!$B$8+${i}`]);
curve.getRange("B4:B369").values = curveRows.map((_, i) => [i]);
curve.getRange("C4:C369").formulas = curveRows.map((_, i) => {
  const row = i + 4;
  return [`=IF(B${row}=0,0,IF(B${row}<=7,FORECAST(B${row},'参数说明'!$B$${dailyAnchorStartRow + 1}:$B$${dailyAnchorStartRow + 2},'参数说明'!$A$${dailyAnchorStartRow + 1}:$A$${dailyAnchorStartRow + 2}),IF(B${row}<=30,FORECAST(B${row},'参数说明'!$B$${dailyAnchorStartRow + 2}:$B$${dailyAnchorStartRow + 3},'参数说明'!$A$${dailyAnchorStartRow + 2}:$A$${dailyAnchorStartRow + 3}),IF(B${row}<=60,FORECAST(B${row},'参数说明'!$B$${dailyAnchorStartRow + 3}:$B$${dailyAnchorStartRow + 4},'参数说明'!$A$${dailyAnchorStartRow + 3}:$A$${dailyAnchorStartRow + 4}),IF(B${row}<=90,FORECAST(B${row},'参数说明'!$B$${dailyAnchorStartRow + 4}:$B$${dailyAnchorStartRow + 5},'参数说明'!$A$${dailyAnchorStartRow + 4}:$A$${dailyAnchorStartRow + 5}),IF(B${row}<=180,FORECAST(B${row},'参数说明'!$B$${dailyAnchorStartRow + 5}:$B$${dailyAnchorStartRow + 6},'参数说明'!$A$${dailyAnchorStartRow + 5}:$A$${dailyAnchorStartRow + 6}),FORECAST(B${row},'参数说明'!$B$${dailyAnchorStartRow + 6}:$B$${dailyAnchorStartRow + 7},'参数说明'!$A$${dailyAnchorStartRow + 6}:$A$${dailyAnchorStartRow + 7})))))))`];
});
curve.getRange("D4:D369").formulas = curveRows.map((_, i) => {
  const row = i + 4;
  return row === 4 ? [`=C${row}`] : [`=D${row - 1}+C${row}`];
});
curve.getRange("E4:E369").formulas = curveRows.map((_, i) => {
  const row = i + 4;
  return [`=IF(D${row}<'等级-经验对照'!$B$4,0,LOOKUP(D${row},'等级-经验对照'!$B$4:$B$103,'等级-经验对照'!$A$4:$A$103))`];
});
curve.getRange("F4:F369").formulas = curveRows.map((_, i) => {
  const row = i + 4;
  return [`=IF(OR(B${row}=1,B${row}=7,B${row}=30,B${row}=60,B${row}=90,B${row}=180,B${row}=365),"D"&B${row}&" / Lv"&E${row}&" / "&ROUND(D${row},0)&" XP","")`];
});
styleTable(curve, "A3:F369", "A3:F3");
curve.freezePanes.freezeRows(3);
curve.getRange("A:A").format.columnWidth = 14;
curve.getRange("B:E").format.columnWidth = 14;
curve.getRange("F:F").format.columnWidth = 30;
curve.getRange("A4:A369").setNumberFormat("yyyy-mm-dd");
curve.getRange("B4:E369").format.numberFormat = [["#,##0"]];

curve.getRange("G3:K13").values = [
  ["关键节点表", "", "", "", ""],
  ["节点", "日期", "当日 XP", "累计经验", "等级/说明"],
  ["D1", null, null, null, "首日反馈"],
  ["D7", null, null, null, "首周习惯"],
  ["D30", null, null, null, "30 日目标"],
  ["D60", null, null, null, "两个月成长"],
  ["D90", null, null, null, "季度目标"],
  ["D180", null, null, null, "半年目标"],
  ["D365", null, null, null, "年度目标"],
  ["图表说明", "X 轴使用相对天数 D0-D365，比日期更清楚。", "", "", ""],
  ["数据源", "等级线：B/E；累计经验线：B/D；当日 XP 辅助线：B/C。", "", "", ""],
];
const nodeRows = [1, 7, 30, 60, 90, 180, 365];
curve.getRange("H5:H11").formulas = nodeRows.map((day) => [`=XLOOKUP(${day},$B$4:$B$369,$A$4:$A$369)`]);
curve.getRange("I5:I11").formulas = nodeRows.map((day) => [`=XLOOKUP(${day},$B$4:$B$369,$C$4:$C$369)`]);
curve.getRange("J5:J11").formulas = nodeRows.map((day) => [`=XLOOKUP(${day},$B$4:$B$369,$D$4:$D$369)`]);
curve.getRange("K5:K11").formulas = nodeRows.map((day) => [`="Lv"&XLOOKUP(${day},$B$4:$B$369,$E$4:$E$369)&" / "&XLOOKUP(${day},$B$4:$B$369,$F$4:$F$369)`]);
curve.getRange("G3:K13").format.borders = { preset: "all", style: "thin", color: colors.border };
curve.getRange("G3:K4").format.fill = { color: colors.blue };
curve.getRange("G3:K4").format.font = { name: "Arial", bold: true, color: colors.text };
curve.getRange("G:K").format.columnWidth = 18;
curve.getRange("K:K").format.columnWidth = 24;
curve.getRange("G3:K13").format.wrapText = true;
curve.getRange("H5:H11").setNumberFormat("yyyy-mm-dd");
curve.getRange("I5:J11").format.numberFormat = [["#,##0"]];

const errorScan = await wb.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "formula error scan",
});
console.log(errorScan.ndjson);

const sample = await wb.inspect({
  kind: "table",
  range: "等级-经验对照!A1:C12",
  include: "values,formulas",
  tableMaxRows: 12,
  tableMaxCols: 4,
});
console.log(sample.ndjson);

await fs.mkdir(outputDir, { recursive: true });
for (const [sheetName, fileName, range] of [
  ["等级-经验对照", "Pinu等级经验曲线_简版_等级预览.png", "A1:C36"],
  ["日期-等级经验曲线", "Pinu等级经验曲线_简版_曲线预览.png", "A1:K24"],
  ["参数说明", "Pinu等级经验曲线_简版_参数预览.png", `A1:D${notesStartRow + 6}`],
]) {
  const preview = await wb.render({ sheetName, range, scale: 2, format: "png" });
  await fs.writeFile(`${outputDir}/${fileName}`, new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(wb);
await output.save(outputPath);
console.log(outputPath);

import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/admini/Documents/Pinu/outputs/power_analysis_excel";
const outputPath = `${outputDir}/能量系统数据分析框架.xlsx`;

const wb = Workbook.create();

const analysis = wb.worksheets.add("分析框架");
const events = wb.worksheets.add("埋点字段清单");
const experiment = wb.worksheets.add("实验与调参");

const font = { name: "微软雅黑", size: 14, color: "#111827" };
const titleFont = { name: "微软雅黑", size: 18, bold: true, color: "#FFFFFF" };
const headerFont = { name: "微软雅黑", size: 14, bold: true, color: "#111827" };
const sectionFont = { name: "微软雅黑", size: 15, bold: true, color: "#111827" };
const border = { preset: "all", style: "thin", color: "#D9E2EC" };

function styleSheet(sheet, usedRange) {
  const range = sheet.getRange(usedRange);
  range.format = {
    font,
    wrapText: true,
    verticalAlignment: "top",
    borders: border,
  };
}

function setTitle(sheet, range, text) {
  sheet.getRange(range).merge();
  sheet.getRange(range).values = [[text]];
  sheet.getRange(range).format = {
    fill: "#1F4E79",
    font: titleFont,
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };
}

function setHeader(sheet, range) {
  sheet.getRange(range).format = {
    fill: "#D9EAF7",
    font: headerFont,
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: border,
  };
}

function setSection(sheet, range) {
  sheet.getRange(range).format = {
    fill: "#EEF6FD",
    font: sectionFont,
    verticalAlignment: "center",
    wrapText: true,
    borders: border,
  };
}

function setBody(sheet, range) {
  sheet.getRange(range).format = {
    fill: "#FFFFFF",
    font,
    verticalAlignment: "top",
    wrapText: true,
    borders: border,
  };
}

function setWidths(sheet, widths) {
  for (const [col, px] of Object.entries(widths)) {
    sheet.getRange(`${col}:${col}`).format.columnWidthPx = px;
  }
}

function setRowHeights(sheet, startRow, endRow, px) {
  for (let r = startRow; r <= endRow; r += 1) {
    sheet.getRange(`${r}:${r}`).format.rowHeightPx = px;
  }
}

setTitle(analysis, "A1:J1", "能量系统上线后数据分析框架");
analysis.getRange("A2:J2").values = [[
  "分析问题",
  "核心假设",
  "分析模块",
  "关键指标",
  "推荐口径 / 公式",
  "维度拆分",
  "判断逻辑",
  "可能结论",
  "建议动作",
  "优先级",
]];

const analysisRows = [
  [
    "能量供给是否过多，导致触达耗尽弹窗用户少？",
    "每日可用能量供给大于用户真实学习消耗，用户很少被付费墙拦截。",
    "能量供需平衡",
    "日均供给、日均消耗、净能量压力、日末余额分布、耗尽用户占比",
    "每日可用能量供给 = 初始余额 + 自动恢复 + 方式A领取 + 方式B领取 + 连对奖励 + 全对奖励\n每日消耗需求 = 当日有效答题数，不含跳过/错题重练\n净能量压力 = 消耗需求 - 每日可用能量供给\n耗尽用户占比 = 当日触发耗尽弹窗UV / 非订阅DAU",
    "新手/非新手、低/中/高学习强度、注册天数、游客/登录、课程、level题量、是否领取A/B",
    "高活跃用户净能量压力 <= 0 且日末余额长期在20-25，说明能量墙偏松。\n大量用户长期为0且留存下降，说明可能过严。",
    "能量供给偏宽 / 只对重度用户有效 / 对多数用户无感 / 过严伤害体验",
    "如偏宽：降低cap、降低方式A额度、延长方式A冷却、降低奖励概率或额度。\n如过严：提高新手期保护、优化B次数或文案。",
    "P0",
  ],
  [
    "触达耗尽弹窗后，用户是订阅、领取继续学，还是流失？",
    "耗尽弹窗是核心转化触点，但不同场景的行为差异很大。",
    "耗尽后行为漏斗",
    "弹窗曝光UV、订阅CTA点击率、订阅页到达率、订阅成功率、方式B领取率、关闭率、耗尽后流失率",
    "耗尽弹窗订阅转化率 = 弹窗曝光后当日订阅成功UV / 弹窗曝光UV\n耗尽后续做率 = 耗尽后10分钟内继续答题UV / 耗尽UV\n耗尽后流失率 = 耗尽后关闭且当日不再学习UV / 耗尽UV",
    "做题中/做题入口/新手引导、CTA形态、是否B可领、B剩余次数、余额归零前题序、是否最后一题附近",
    "做题中耗尽转化高，说明投入状态下付费动机更强。\n入口耗尽流失高，说明启动阻力过强。",
    "付费墙有效 / 用户主要靠B绕过 / 入口拦截伤害启动 / 弹窗文案或CTA弱",
    "分场景调CTA：做题中强化订阅，入口场景保留救济；对B用完用户突出订阅CTA。",
    "P0",
  ],
  [
    "方式A / 方式B / 自动恢复 / 奖励，分别在多大程度上稀释了付费墙？",
    "免费补能机制越强，越可能替代订阅，而不是辅助体验。",
    "免费补能拆解",
    "各来源能量占比、领取用户占比、人均领取次数、领取后再次耗尽率、领取后订阅率",
    "来源能量占比 = 某来源获得能量点数 / 总获得能量点数\n方式A日均领取次数 = 方式A领取次数 / 非订阅DAU\n方式B使用率 = 方式B领取UV / 耗尽弹窗曝光UV",
    "只领A、只领B、A+B都领、不领取；领取频次分位数；新手/非新手；高学习强度用户",
    "若高频领取A/B用户学习量高但订阅率低，说明免费补能有替代付费风险。\n若领取后留存明显提升且订阅不降，说明救济是正向体验。",
    "A太容易领 / B次数过多 / 奖励对高价值用户过宽 / 自动恢复足够覆盖日常学习",
    "优先收紧最高稀释来源：方式A冷却/额度、方式B次数、奖励触发或额度。",
    "P0",
  ],
  [
    "非订阅用户能量耗尽比例应该怎么看？",
    "单看耗尽比例容易误判，需要结合学习意愿和消耗需求。",
    "耗尽率解释",
    "耗尽UV/DAU、耗尽UV/有效学习UV、高学习用户耗尽率、首次耗尽时间",
    "用户能量耗尽比例 = 能量耗尽用户UV / 非订阅DAU\n学习用户耗尽比例 = 能量耗尽用户UV / 当日有效答题用户UV\n高学习用户耗尽比例 = 高学习且耗尽UV / 高学习UV",
    "答题数分层、学习时长分层、注册天数、日初余额、是否触达能量页",
    "DAU口径低但学习用户口径高，说明墙只影响学习人群。\n高学习用户耗尽率低，说明墙对最有价值人群不够有效。",
    "整体无感 / 只影响重度用户 / DAU口径被低活用户稀释",
    "主报表同时展示DAU口径、有效学习用户口径、高学习用户口径。",
    "P0",
  ],
  [
    "能量限制是否伤害学习留存、新手激活或学习深度？",
    "付费墙可能带来收入，也可能降低学习完成和留存。",
    "体验与留存守护",
    "D1/D3/D7留存、level完成率、学习时长、答题数、耗尽后退出率、次日回访率",
    "耗尽组D1留存 vs 未耗尽但学习强度相近用户D1留存\nlevel完成率 = 完成level UV / 开始level UV\n耗尽后退出率 = 耗尽后退出学习流UV / 耗尽UV",
    "新手期内/期外、入口/做题中、不同level题量、不同正确率、游客/登录",
    "耗尽组订阅提升但留存大降，需要权衡。\n耗尽组学习更深且留存稳定，说明限制可接受。",
    "付费有效且体验可控 / 付费提升伴随留存损伤 / 新手被过早打断",
    "设置护栏：新手D1、level完成率、有效学习用户留存不得明显下降。",
    "P0",
  ],
  [
    "new / old 分别代表什么？应该如何分层？",
    "新老用户对能量墙的感知不同；新手期会强烈影响结果。",
    "用户生命周期分层",
    "注册天数、是否新手保护期、首日耗尽率、保护期结束后耗尽率、回流老用户耗尽率",
    "新用户建议按注册第0天、第1天、第2天、第3-7天分层。\n老用户建议按上线前已存在用户、上线后新注册用户、订阅过期回流用户分层。",
    "游客/登录、新手保护期、是否完成新手引导、是否老账号登录、订阅过期回流",
    "新手期无限B会推迟付费墙，不能把新手和老用户混在一起算总体转化。",
    "新手保护期延后转化 / 老用户更快触墙 / 回流用户余额策略影响明显",
    "核心报表固定拆新手期内、保护期后1-3天、老用户。",
    "P1",
  ],
  [
    "是否需要 A/B test？",
    "能量参数高度影响付费和留存，直接全量调参风险大。",
    "实验设计",
    "订阅转化率、耗尽弹窗转化率、方式B领取率、D1/D7留存、答题数、level完成率",
    "实验组与对照组按用户随机；至少覆盖完整周周期。\n主指标：非订阅转订阅率或耗尽弹窗订阅转化率。\n护栏：D1/D7留存、level完成率、学习题数。",
    "新手/老用户、高学习/低学习、入口/做题中场景、国家/语言方向",
    "如果转化提升但留存下降，需要计算LTV是否覆盖损失。\n如果转化不变但领取下降，说明只是压缩学习体验。",
    "可调参数包括cap、方式A冷却/额度、方式B次数/额度、新手期天数、弹窗CTA形态。",
    "先小流量实验，再按分层结果扩大。",
    "P1",
  ],
  [
    "能量奖励会不会让高正确率用户绕过限制？",
    "连对/全对奖励集中给学习质量高、可能更愿意付费的用户。",
    "奖励效果分析",
    "奖励触发率、奖励点数、人均奖励、奖励后耗尽率、奖励用户订阅率",
    "奖励能量占比 = 连对+全对奖励点数 / 总获得能量点数\n奖励触发率 = 触发奖励UV / 有效学习UV",
    "正确率、combo水平、level题量、学习强度、是否高频学习",
    "高正确率用户日末余额偏高且很少触达弹窗，说明奖励可能让优质用户绕过付费墙。",
    "奖励正反馈有效 / 奖励稀释转化 / 只影响少数用户",
    "可考虑奖励只做动效、降低额度、或对接近满值时不发放。",
    "P2",
  ],
];

analysis.getRange(`A3:J${analysisRows.length + 2}`).values = analysisRows;
styleSheet(analysis, `A1:J${analysisRows.length + 2}`);
setHeader(analysis, "A2:J2");
setBody(analysis, `A3:J${analysisRows.length + 2}`);
setWidths(analysis, {
  A: 300, B: 260, C: 150, D: 260, E: 420, F: 280, G: 330, H: 260, I: 320, J: 80,
});
setRowHeights(analysis, 1, 1, 34);
setRowHeights(analysis, 2, 2, 54);
setRowHeights(analysis, 3, analysisRows.length + 2, 132);
analysis.freezePanes.freezeRows(2);

setTitle(events, "A1:H1", "埋点与数据字段清单");
events.getRange("A2:H2").values = [[
  "事件 / 表",
  "触发时机",
  "核心字段",
  "必须字段",
  "用于分析",
  "注意事项",
  "负责人",
  "优先级",
]];
const eventRows = [
  ["power_balance_change", "任意能量余额变化后", "user_id/device_id、event_time、before_balance、after_balance、change_value、change_reason", "change_reason 枚举：question_deduct / auto_recover / claim_A / claim_B / combo_reward / full_correct_reward / subscription_expire", "还原每日供给、消耗、净能量压力、日末余额", "余额以服务端为准；离线同步要带原始发生时间和同步时间", "数据/后端", "P0"],
  ["power_depleted_popup_show", "能量=0且耗尽弹窗曝光", "scene、cta_type、is_novice、balance、b_remaining_count、level_id、question_index", "scene 枚举：in_level / entry / onboarding_entry / onboarding_in_level", "耗尽率、弹窗曝光、场景转化", "最后一题余额归零不弹窗，不能记曝光", "客户端", "P0"],
  ["power_popup_cta_click", "弹窗内点击CTA或关闭", "action、scene、cta_type、is_novice、b_remaining_count", "action 枚举：subscribe_click / claim_B_click / close / give_up", "弹窗行为分流、订阅点击率、领取率、关闭率", "订阅失败/中断后应能回流到原弹窗状态", "客户端", "P0"],
  ["power_claim_success", "方式A或方式B领取成功", "claim_type、grant_value、before_balance、after_balance、is_novice、remaining_count", "claim_type 枚举：A / B", "免费补能稀释分析、领取频次", "失败不应计成功；按钮灰态点击应单独记失败或toast", "后端/客户端", "P0"],
  ["question_submit", "有效题目首次提交", "level_id、question_id、question_index、is_last_question、is_skip、is_retry_wrong、power_deducted", "power_deducted 必须准确区分跳过/错题重练", "消耗需求、题序耗尽、学习强度", "每题埋点量较大，可用服务端答题表替代或汇总", "客户端/数仓", "P0"],
  ["subscription_page_enter", "进入订阅页", "source、source_scene、from_popup、popup_exposure_id", "source 标识是否来自耗尽弹窗", "订阅漏斗中间环节", "需要与订阅成功事件可关联", "订阅模块", "P0"],
  ["subscription_success", "订阅或trial成功", "subscription_type、source、source_scene、is_trial、amount、currency", "trial 按订阅处理", "最终商业结果、弹窗转化", "成功归因建议保留最近一次耗尽弹窗ID", "订阅模块", "P0"],
  ["user_day_power_snapshot", "每日离线宽表", "date、user_id、is_subscriber、is_novice、start_balance、end_balance、gain_by_source、consume_count、depleted_count", "按用户本地时区自然日聚合", "主报表、供需平衡、分层分析", "建议数仓产出，避免每次扫明细事件", "数仓", "P0"],
  ["level_progress", "开始/完成level", "level_id、course_id、start_time、finish_time、question_count、completed、accuracy", "question_count 与能量消耗需求强相关", "学习体验护栏、level完成率", "题量差异要进入维度拆分", "客户端/学习业务", "P1"],
];
events.getRange(`A3:H${eventRows.length + 2}`).values = eventRows;
styleSheet(events, `A1:H${eventRows.length + 2}`);
setHeader(events, "A2:H2");
setBody(events, `A3:H${eventRows.length + 2}`);
setWidths(events, { A: 220, B: 240, C: 360, D: 380, E: 260, F: 320, G: 120, H: 80 });
setRowHeights(events, 1, 1, 34);
setRowHeights(events, 2, 2, 54);
setRowHeights(events, 3, eventRows.length + 2, 110);
events.freezePanes.freezeRows(2);

setTitle(experiment, "A1:I1", "实验与调参建议");
experiment.getRange("A2:I2").values = [[
  "实验/调参方向",
  "目标",
  "对照组",
  "实验组示例",
  "主指标",
  "护栏指标",
  "预期信号",
  "风险",
  "建议优先级",
]];
const experimentRows = [
  ["降低方式A稀释", "验证常态领取是否过度补能", "方式A每60分钟+5，无日上限", "方式A每120分钟+5；或每60分钟+3；或设置日上限", "耗尽弹窗曝光UV、订阅成功率", "D1留存、答题数、level完成率", "曝光和订阅提升，学习护栏不显著下降", "可能让轻度用户体感变差", "P0"],
  ["收紧非新手方式B", "验证耗尽弹窗应急领取是否替代订阅", "非新手B每日3次，每次+5", "每日1-2次；或第1次+5后续+3；或B用完强化订阅CTA", "耗尽弹窗订阅转化率、方式B领取率", "耗尽后流失率、次日留存", "B领取下降，订阅提升，流失可控", "墙太硬会直接流失", "P0"],
  ["调整新手保护期", "平衡新手激活和付费墙触达", "新手期2天，B无限充满", "新手期1天；或2天但B每日有限次；或第3天渐进收紧", "第3-7天订阅率、保护期后耗尽率", "新手D1/D3留存、新手level完成率", "保护期后转化提升，早期留存不受损", "过早打断新手价值感", "P1"],
  ["弹窗CTA形态", "优化耗尽场景转化", "订阅+B并列", "做题中突出订阅；入口突出领取；B用完时订阅主按钮", "订阅CTA点击率、订阅页到达率、成功率", "关闭率、继续学习率", "做题中订阅点击提升，入口关闭率不升", "CTA过强导致反感", "P1"],
  ["奖励额度调整", "验证奖励是否让高意愿用户绕过墙", "连对/全对随机+1~5", "降低为+1~3；接近满值不发；只展示动效不加能量", "高学习用户耗尽率、订阅率", "正确率、完成率、学习时长", "高学习用户触墙增加且留存稳定", "打击正反馈，影响学习爽感", "P2"],
];
experiment.getRange(`A3:I${experimentRows.length + 2}`).values = experimentRows;
styleSheet(experiment, `A1:I${experimentRows.length + 2}`);
setHeader(experiment, "A2:I2");
setBody(experiment, `A3:I${experimentRows.length + 2}`);
setWidths(experiment, { A: 220, B: 240, C: 260, D: 320, E: 240, F: 300, G: 300, H: 260, I: 100 });
setRowHeights(experiment, 1, 1, 34);
setRowHeights(experiment, 2, 2, 54);
setRowHeights(experiment, 3, experimentRows.length + 2, 122);
experiment.freezePanes.freezeRows(2);

// Section-like emphasis in the main sheet.
for (const row of [3, 4, 5, 6, 7, 8, 9, 10]) {
  analysis.getRange(`A${row}:J${row}`).format.fill = row % 2 === 1 ? "#FFFFFF" : "#F8FBFD";
}

// Compact summary panel on the right side of the main sheet, echoing the screenshot structure.
analysis.getRange("L1:P1").merge();
analysis.getRange("L1:P1").values = [["优先看的结论"]];
analysis.getRange("L1:P1").format = {
  fill: "#1F4E79",
  font: titleFont,
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
analysis.getRange("L2:P7").values = [
  ["1", "能量是否偏松", "看高活跃用户净能量压力、日末余额、耗尽率", "高活跃也长期不缺能量 = 偏松", "P0"],
  ["2", "付费墙是否有效", "看耗尽弹窗曝光到订阅成功漏斗", "做题中耗尽转化通常更关键", "P0"],
  ["3", "免费补能是否替代付费", "看A/B领取后订阅率与再次耗尽率", "高频领取低订阅 = 稀释", "P0"],
  ["4", "是否伤害学习体验", "看耗尽后流失、level完成率、D1/D7留存", "转化提升但留存下降要谨慎", "P0"],
  ["5", "是否需要实验", "能量参数建议A/B，不建议直接全量调", "主指标+护栏指标一起看", "P1"],
  ["6", "新手期影响", "新手期内/结束后分开看", "无限B会延迟付费墙触达", "P1"],
];
analysis.getRange("L2:P7").format = {
  fill: "#FFFFFF",
  font,
  verticalAlignment: "top",
  wrapText: true,
  borders: border,
};
analysis.getRange("L2:L7").format.horizontalAlignment = "center";
analysis.getRange("L:L").format.columnWidthPx = 46;
analysis.getRange("M:M").format.columnWidthPx = 170;
analysis.getRange("N:N").format.columnWidthPx = 300;
analysis.getRange("O:O").format.columnWidthPx = 280;
analysis.getRange("P:P").format.columnWidthPx = 80;
setRowHeights(analysis, 2, 7, 58);

// Apply section style to title/header areas after body calls.
setTitle(analysis, "A1:J1", "能量系统上线后数据分析框架");
setHeader(analysis, "A2:J2");
setTitle(events, "A1:H1", "埋点与数据字段清单");
setHeader(events, "A2:H2");
setTitle(experiment, "A1:I1", "实验与调参建议");
setHeader(experiment, "A2:I2");

// Light priority highlighting.
for (const [sheet, col, lastRow] of [[analysis, "J", analysisRows.length + 2], [events, "H", eventRows.length + 2], [experiment, "I", experimentRows.length + 2]]) {
  sheet.getRange(`${col}3:${col}${lastRow}`).format = {
    fill: "#FFF2CC",
    font: { name: "微软雅黑", size: 14, bold: true, color: "#7A4F01" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    borders: border,
  };
}

await fs.mkdir(outputDir, { recursive: true });

const inspect = await wb.inspect({
  kind: "table",
  range: "分析框架!A1:J10",
  include: "values,formulas",
  tableMaxRows: 10,
  tableMaxCols: 10,
});
console.log(inspect.ndjson);

const errors = await wb.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 50 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

await wb.render({ sheetName: "分析框架", range: "A1:P10", scale: 1 });
await wb.render({ sheetName: "埋点字段清单", range: "A1:H11", scale: 1 });
await wb.render({ sheetName: "实验与调参", range: "A1:I7", scale: 1 });

const output = await SpreadsheetFile.exportXlsx(wb);
await output.save(outputPath);
console.log(outputPath);

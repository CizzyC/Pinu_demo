# Pinu 项目索引

更新日期：2026-06-18

## 项目简介

Pinu 是一个正在建设中的学习类产品项目，对标竞品为 Duolingo。当前产品方向集中在语言学习，重点体验包括真实生活句子、口语练习、即时反馈和游戏化学习路径。

## 当前角色

当前负责方向：激励模块产品经理。

核心工作是围绕学习过程中的用户激励、留存、持续参与和付费转化，设计产品中的游戏化机制与底层激励体系。

## 当前工作主线

| 主线 | 当前问题 |
|---|---|
| 竞品拆解 | 拆解 Duolingo、Mimo、Sololearn、MaruMori 等产品的激励、留存和付费模型 |
| 激励底层 | 明确 XP、Coins、Items、Mastery、Collection 等系统的定位和边界 |
| 经济循环 | 判断金币、宝箱、金币商店、道具、宠物、赛季资产如何形成长期循环 |
| 能量系统 | 分析 Pinu 已上线 Power 系统是否有效制造软付费墙，同时不伤害学习体验 |
| 付费转化 | 借鉴 Duolingo 订阅主导模式，判断 Pinu 付费应优先承接学习效率和高阶反馈 |

## 核心结论

- Pinu 不应只做“小 Duolingo”，更适合把 Duolingo 式激励机制和真实场景口语练习结合起来。
- XP 应作为学习活跃记录，用于等级、任务、排行榜和成就门槛，但不能代表真实掌握。
- Mastery 应用于衡量用户是否真正掌握场景、句子和口语能力，不能被付费直接购买。
- Coins 应作为可消费货币，承接金币商店、宠物、装扮、赛季资产和 IAP，但不能买排名、XP 或 Mastery。
- 能量系统要作为 soft paywall 谨慎调参，核心判断标准是“不明显伤害学习体验的前提下，有效制造订阅转化动机”。
- Duolingo 最新财报显示其收入仍高度依赖订阅，FY2025 订阅收入约占 84.2%，Q1 2026 订阅收入约占 85.9%。这说明游戏化的商业价值主要在于提高活跃、留存、订阅转化和续费，而不是直接卖道具。

## 文档结构

| 文件 | 内容 |
|---|---|
| `pinu_project_overview_2026-06-18.md` | 项目总览、当前进展、竞品结论、激励系统方向和能量系统专项摘要 |
| `pinu_current_status_update_2026-06-18.md` | 当前对话后的项目现状补充、文档结构整理和下一步建议 |
| `duolingo_paid_strategy_analysis.md` | Duolingo 付费策略与收入占比分析 |
| `duolingo_xp_system_analysis.md` | Duolingo XP 底层系统拆解 |
| `duolingo_energy_system_analysis_2026-06-18.md` | Duolingo Hearts / Energy 系统演进、用户反馈和对 Pinu Power 的校准 |
| `pinu_competitive_analysis_retention.md` | Mimo / Sololearn / MaruMori / Pinu 竞品分析，聚焦激励留存 |
| `pinu_incentive_system_design.md` | Pinu 底层激励系统设计分析 |
| `pinu_incentive_economy_analysis_2026-06-18.md` | Pinu 激励经济系统补充分析 |
| `pinu_power_system_status_2026-06-18.md` | Pinu 能量系统项目现状与数据分析专项记录 |
| `outputs/power_analysis_excel/能量系统数据分析框架.xlsx` | 能量系统数据分析 Excel 框架 |
| `outputs/pinu_reviews/Pinu_AppStore_US_Reviews_2026-06-17.xlsx` | Pinu App Store US 评价分析工作簿 |

## 当前下一步

1. 明确 Pinu 第一版是否采用 `XP + Coins + Items + Mastery` 的底层结构。
2. 确定 Coins 第一批消耗口：护照章、宠物互动、头像框、Streak Freeze、赛季拼图中的优先级。
3. 校验能量系统埋点是否支持耗尽弹窗、免费补能、订阅 CTA 和订阅成功归因。
4. 将 Duolingo 付费策略结论转化为 Pinu 的订阅权益草案，优先考虑 AI 口语反馈、个性化复习和高级场景练习。

## 当前项目现状

截至 2026-06-18，项目资料已形成以下方向：

- 底层激励系统：围绕 XP、Coins、Items、Mastery、Collection 设计学习奖励、资产沉淀和付费边界。
- 能量系统专项：能量系统已上线，当前重点是分析付费墙触达、免费补能稀释、订阅转化和学习体验护栏。
- Duolingo Energy 校准：已补充 Hearts / Energy 机制演进分析，确认 Pinu Power 需要重点监控单课题量、净能量压力、高正确率用户耗尽和免费补能稀释。
- 6.18 沟通工作方向：已根据沟通截图生成 `6.18沟通-工作方向.xmind`，并整理个人档案、角色形象、支线玩法、赛季、数值驱动和商业化方向。

# Duolingo 付费策略分析

更新日期：2026-06-17

## 结论摘要

Duolingo 的商业模式是订阅主导的 freemium 学习产品。它通过大规模免费内容、游戏化机制和高频学习习惯扩大活跃用户池，再将一部分用户转化为付费订阅。广告、IAP 和 Duolingo English Test 是补充收入来源，但不是主收入引擎。

对 Pinu 的启发：激励模块应优先服务“免费用户长期活跃 -> 形成学习习惯 -> 订阅转化/续费”的路径，而不是过早把激励设计成单纯道具售卖。

## 付费策略

| 模型 | 策略 | 说明 |
|---|---:|---|
| 订阅 | 核心收入 | Super Duolingo 和 Duolingo Max；月付/年付，Family Plan 为年订阅 |
| Family Plan | 家庭/多人转化 | 年付，一个订阅最多 6 个用户 |
| Max 高阶订阅 | AI 溢价 | 比 Super 更高价，包含 AI 功能，如 Video Call 等 |
| 广告 | 免费用户变现 | 对不付费用户展示 display/video ads，通过广告网络变现 |
| IAP | 低门槛小额消费 | 如 Streak Freezes、Timer Boosts 等一次性虚拟物品 |
| Duolingo English Test | 非订阅考试收入 | 向考生收一次性费用，2025 年约占总收入 4.0% |
| 其他 | 极小 | 2025 年约 0.2%，不是主线业务 |

## 收入占比

### FY2025 年度口径

Duolingo FY2025 总收入为 1,037.6 百万美元。

| 收入类型 | FY2025 收入 | 占比 |
|---|---:|---:|
| Subscription | 873.4 百万美元 | 84.2% |
| Advertising | 79.7 百万美元 | 7.7% |
| Duolingo English Test | 42.0 百万美元 | 4.0% |
| IAPs | 40.5 百万美元 | 3.9% |
| Other | 1.9 百万美元 | 0.2% |

### Q1 2026 最新季度口径

Duolingo Q1 2026 总收入为 292.0 百万美元。

| 收入类型 | Q1 2026 收入 | 占比 |
|---|---:|---:|
| Subscription | 250.9 百万美元 | 85.9% |
| Advertising | 20.6 百万美元 | 7.1% |
| Duolingo English Test | 11.3 百万美元 | 3.9% |
| IAPs | 8.4 百万美元 | 2.9% |
| Other | 0.7 百万美元 | 0.2% |

## 关键运营指标

- 2025 年 12 月 31 日：约 12.2 百万 paid subscribers，同比增长 28%。
- 2025 年 Q4：约 133.1 百万 MAUs，约 52.7 百万 DAUs。
- 2025 年：paid subscribers 占过去 12 个月平均 MAUs 的 9.2%，高于 2024 年的 8.8%。
- 2026 年 Q1：约 12.5 百万 paid subscribers，同比增长 21%；DAUs 约 56.5 百万，同比增长 21%。

## 策略判断

Duolingo 不是“广告 + IAP”的手游式模型，而是“订阅为主，广告和 IAP 补充”的学习产品模型。它的激励体系并不只是为了制造即时消费，而是为了提高学习频率、留存、订阅转化和续费。

其关键商业逻辑可以概括为：

1. 通过免费内容降低进入门槛，扩大用户池。
2. 通过游戏化机制提高 DAU、学习频率和长期留存。
3. 通过 Super Duolingo 承接主流付费转化。
4. 通过 Duolingo Max 提供 AI 功能溢价，提高 ARPU。
5. 通过广告和 IAP 对非订阅用户做轻量变现。
6. 通过 Duolingo English Test 建立独立的高信任考试业务收入。

## 对 Pinu 激励模块的启发

Pinu 的激励模块不应只追求短期刺激，而应围绕学习产品的长期转化漏斗设计：

- 免费阶段：用 streak、任务、成就、等级、即时反馈等机制建立学习习惯。
- 活跃阶段：通过社交比较、阶段目标、连续学习保护等机制提高留存。
- 付费转化阶段：让高级权益解决真实学习痛点，而不是简单移除限制。
- 高阶付费阶段：可考虑把 AI 练习、个性化反馈、专项训练等作为溢价能力。
- 非订阅用户：广告/IAP 可以作为补充，但不应破坏学习体验和长期信任。

## 数据来源

- Duolingo FY2025 Form 10-K, filed Feb 27, 2026: https://www.sec.gov/Archives/edgar/data/1562088/000162828026012494/duol-20251231.htm
- Duolingo Q1 2026 Form 10-Q, filed May 5, 2026: https://www.sec.gov/Archives/edgar/data/1562088/000162828026029976/duol-20260331.htm
- Duolingo Q1 2026 Shareholder Letter, May 4, 2026: https://www.sec.gov/Archives/edgar/data/1562088/000162828026029790/q1fy26duolingo3-31x26share.htm
- Apple App Store: Duolingo app listing: https://apps.apple.com/us/app/duolingo-language-lessons/id570060128

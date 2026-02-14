# TickDB Demo Series

这是一个围绕 TickDB 行情 API 构建的系列 Demo 仓库。

本仓库通过多个逐步演进的示例，演示如何基于统一的行情接口构建：

实时行情展示系统

股票 / 外汇 / 港股 / A 股 / 加密货币行情面板

K 线（蜡烛图）历史数据展示

时间序列数据可视化

实时行情与历史行情的结合处理

每个 Demo 对应一篇完整的技术文章，记录从设计思路、接口选择、数据结构处理到前端实现的完整过程。

代码负责实现，文章负责解释。

---

## 📂 仓库结构

```
tickdb-demo-ticker-panel/
├── README.md
├── .gitignore
├── LICENSE
├── demo-01-ticker-panel/        # Demo #1：Ticker 行情面板
│   ├── src/
│   ├── README.md
│   └── wireframe.png
├── demo-02-ticker-kline-panel/  # Demo #2：Ticker + K线 行情面板
│   ├── src/
│   ├── panel.gif
│   └── README.md
└── demo-03-xxxx/                # 规划中
```

---

## 📖 Demo 与文章对应关系

本仓库中的每个 Demo，都对应一篇独立的技术实现文章。

文章内容包括：

- 行情 API 使用方式
- 实时行情数据获取
- K 线历史数据处理
- 最新 K 线实时更新逻辑
- 预加载策略与性能优化
- 前端时间序列展示方案
- 系统结构演进与分层设计

| Demo | 内容说明 | 对应文章 |
|------|---------|---------|
| [Demo #1](demo-01-ticker-panel/) | Ticker 实时行情面板 | 《用 Ticker API 写一个行情面板：一次完整的实现过程》 |
| [Demo #2](demo-02-ticker-kline-panel/) | 行情列表 + K线 结构升级 | 《在行情面板中加入 K 线：一次结构升级的实现过程》 |
| Demo #3 | 规划中 | 待发布 |

👉 系列文章发布于知乎专栏：（可在知乎搜索：TickDB 行情 API 系列）
https://www.zhihu.com/column/c_1993366913456300526

---

## 🎯 本仓库适合谁？

- 想接入股票行情 API 的开发者

- 想实现 K 线图表展示的前端工程师

- 希望构建多市场实时行情系统的开发者

- 对时间序列数据处理感兴趣的技术人员

- 需要学习行情 API 正确使用方式的工程师

---

## 🔒 版本说明

- `main` 分支会持续新增 Demo
- 每个 Demo 目录在对应文章发布后会保持“冻结状态”
- 后续演进将通过新的 Demo 目录展开

这样可以保证：

读者从文章进入仓库时，
看到的代码与文章内容完全一致。

---

## 🚀 如何使用

1. 根据文章找到对应的 Demo 目录
2. 进入该目录查看 README 了解运行方式
3. 获取 API Key：https://tickdb.ai
4. 运行本地示例

---

## 🔗 相关链接

- TickDB 官网：https://tickdb.ai
- API 文档：https://docs.tickdb.ai

---

## License

MIT License

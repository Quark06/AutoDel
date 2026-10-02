# BetterDiscord 版本

本目录提供桌面端 BetterDiscord 插件，共用 `../shared/core.js` 的共享核心（Shared Core）。

文件职责：

- `index.js`：插件入口（Entry Point），管理启动、停止和设置页。
- `adapter.js`：平台适配层（Adapter），提供账号、聊天、消息订阅、删除调用及存储接口（Storage API）。
- `ui.js`：桌面聊天按钮和设置界面（UI）。

运行 `npm run build:betterdiscord`，生成 `dist/betterdiscord/AutoDel.plugin.js`，复制到 BetterDiscord 的插件文件夹并启用。无需额外插件依赖（Plugin Dependencies）。

界面通过文档对象模型（DOM）监听消息区域变化，计时按钮位于右下角，回底条显示时上移。客户端内部模块名和选择器（Selectors）集中在 `adapter.js`；实际按钮位置与消息删除需团队在目标版本验收。

功能测试（Functional Testing）位于 `tests/betterdiscord/`，验证单文件加载、聊天隔离、延时删除、关闭语义、停用恢复和失败重试。模拟接口（Mock API）通过不表示客户端验收完成。

接口依据：[插件结构（Plugin Structure）](https://docs.betterdiscord.app/plugins/introduction/structure.html)、[模块查询（Webpack API）](https://docs.betterdiscord.app/api/Webpack)、[本地存储（Data API）](https://docs.betterdiscord.app/api/Data)、[界面样式（DOM API）](https://docs.betterdiscord.app/api/DOM)。

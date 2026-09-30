# BetterDiscord 版本

本目录为桌面端 BetterDiscord 插件预留，目前尚未实现，也没有可安装产物（Build Artifacts）。

后续文件安排：

- `index.js`：插件入口（Entry Point），管理启动、停止和设置页。
- `adapter.js`：平台适配层（Adapter），提供账号、聊天、消息订阅、删除调用及存储接口（Storage API）。
- `ui.js`：桌面聊天按钮和设置界面（UI）。

复用 `../shared/core.js` 的共享核心（Shared Core）。实现时新增 `scripts/build-betterdiscord.mjs`，构建到 `dist/betterdiscord/AutoDel.plugin.js`；功能测试（Functional Testing）放在 `tests/betterdiscord/`。

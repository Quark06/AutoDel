# AutoDel · 自动删除插件

同仓库（Repository）维护 Kettu 和 BetterDiscord 版本。目前 Kettu 已有实现，BetterDiscord 仅预留目录。

最小可测试框架（Minimal Testable Scaffold）：按聊天开启，定时删除当前账号自己发送的新消息。

开发范围及推进顺序固定在 [开发路线（Roadmap）](docs/ROADMAP.md)，团队验收步骤见 [功能测试（Functional Testing）](docs/TESTING.md)。

## 开始使用

需要 Node.js 20 或更高版本。

```powershell
npm install
npm test
npm run build
npm run dev
```

- 本地演示（Local Demo）：http://localhost:5173/
- 插件产物（Build Artifacts）：`dist/autodel/manifest.json` 和 `dist/autodel/index.js`
- Kettu 安装地址（Plugin URL）：`http://电脑局域网IP:5173/dist/autodel/`

构建后运行 `npm test` 会额外验证构建产物的生命周期（Lifecycle）。更改源码后重新构建，并在 Kettu 中更新或重新加载插件。

## 当前状态

核心、浏览器演示和 Kettu 接入代码已提供。真机加载、原生按钮布局和 Discord 删除接口尚待验证，不能把本地模拟结果当作真机已可用。

默认删除延时为 5 分钟。聊天开关及待删除任务通过插件本地存储（Local Storage）保存。关闭聊天开关不取消旧任务。应用被系统终止时不能执行删除，重启或恢复前台后补处理。

实现依据为 [Kettu 兼容接口（Compatibility API）](https://github.com/C0C0B01/Kettu/blob/github/src/core/vendetta/api.tsx) 和 [插件加载器（Plugin Loader）](https://github.com/C0C0B01/Kettu/blob/github/src/core/vendetta/plugins.ts)，具体源码参考集中在开发路线中。

## 文件目录（Directory Structure）

```text
src/
  shared/core.js          # 共享核心（Shared Core）
  kettu/
    index.js              # 插件入口（Entry Point）
    adapter.js            # 平台适配层（Adapter）
    ui.js                 # 原生界面（Native UI）
    manifest.json         # 插件清单（Manifest）
  betterdiscord/
    README.md             # BetterDiscord 版本开发说明
scripts/
  build-kettu.mjs         # Kettu 构建脚本（Build Script）
  serve.mjs              # 本地服务（Local Server）
tests/
  shared/core.test.js     # 共享核心功能测试（Functional Testing）
  kettu/plugin.test.js    # Kettu 加载及卸载测试
demo/                    # 浏览器演示（Browser Demo）
docs/                    # 开发路线与验收说明
```

根目录统一管理依赖（Dependencies）和命令。`npm run build` 与 `npm run build:kettu` 均构建 Kettu，继续输出到 `dist/autodel/`，现有安装地址保持有效。BetterDiscord 实现后增加独立构建命令及 `dist/betterdiscord/` 产物目录（Build Artifacts）。

共享核心只处理规则、状态和删除调度；各平台分别实现消息订阅、存储、删除调用及界面接入。

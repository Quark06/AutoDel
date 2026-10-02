# AutoDel · 自动删除消息

AutoDel 是适用于 BetterDiscord 和 Kettu 的 Discord 插件（Plugin）。在指定聊天中开启后，自己发送的新消息会按设定的延时自动删除。

## 功能

- 每个聊天独立开关，开启后计时按钮高亮。
- 只处理开启后自己发送的新消息，不清理历史消息，也不删除其他人的消息。
- 默认延时为 5 分钟，可在插件设置中调整。
- 保存聊天开关和待删除任务，重启后继续处理。
- 设置页显示待删除和失败数量，支持手动重试。

## 安装（Installation）

先安装对应客户端的插件环境：桌面端使用 BetterDiscord，移动端使用 Kettu。当前需要从源码构建（Build）安装文件；真实客户端兼容性仍待验证。

### 准备安装文件

电脑需要安装 Node.js 20 或更高版本。下载本仓库并解压，在解压目录打开终端（Terminal），运行：

```powershell
npm ci
npm run build
```

生成的安装文件：

| 客户端 | 安装文件 |
| --- | --- |
| BetterDiscord | `dist/betterdiscord/AutoDel.plugin.js` |
| Kettu | `dist/autodel/` 中的 `manifest.json` 和 `index.js` |

### BetterDiscord

1. 打开 Discord 设置，进入 BetterDiscord 的插件页（Plugins）。
2. 打开插件文件夹，将 `dist/betterdiscord/AutoDel.plugin.js` 复制进去。
3. 回到插件页，启用 **AutoDel**。

### Kettu

1. 在电脑的项目目录运行 `npm run dev`，保持终端开启。
2. 将手机和电脑连接到同一局域网（LAN），确保电脑防火墙允许端口 `5173`。
3. 在 Kettu 插件页添加以下安装地址（Plugin URL），将占位文字替换为电脑的局域网 IP 地址：

   ```text
   http://电脑局域网IP:5173/dist/autodel/
   ```

4. 安装并启用 **AutoDel**。

如果客户端不接受本地 HTTP 地址，可将 `dist/autodel/` 的两个文件放到 HTTPS 静态托管（Static hosting）服务，再使用该目录的地址安装。更新插件时，安装来源需要保持可访问。

## 使用

1. 打开要自动删除消息的聊天。
2. 点击聊天右下角的 **⏱** 按钮；高亮表示该聊天已开启。
3. 在 AutoDel 设置中选择删除延时。
4. 发送新消息，消息会在到期后自动删除。

再次点击 **⏱** 可关闭当前聊天的自动删除。其他聊天的开关不受影响。

| 客户端 | 可选延时 |
| --- | --- |
| BetterDiscord | 1、5、10、20、30 分钟，以及 10 秒测试档位 |
| Kettu | 1、5、10、15、30 分钟，以及 10 秒测试档位 |

延时设置对当前客户端内所有已开启的聊天生效，修改只影响之后的新消息；已经安排的消息仍按原定时间删除。

## 常见问题（FAQ）

**关闭聊天开关后，之前的消息还会删除吗？**

会。关闭只停止为新消息安排删除，已经安排的任务仍会继续执行。

**关闭 Discord 或停用插件后，还能按时删除吗？**

不能。插件需要在客户端运行时执行删除；重新启动并启用插件后，会继续处理已到期任务。

**消息删除失败怎么办？**

打开 AutoDel 设置查看失败数量，确认客户端在线后点击“重试失败任务”。

**换账号会影响另一账号的任务吗？**

聊天开关和任务按账号分别保存。切换账号后，不会执行另一账号的删除任务。

**会保存消息正文吗？**

不会。插件本地存储（Local storage）仅保存开关、延时、消息标识和删除任务等信息。

**如何更新？**

下载最新源码并重新运行 `npm ci` 和 `npm run build`。BetterDiscord 替换插件文件后重新加载；Kettu 更新安装来源中的文件，再通过客户端更新插件。

## 问题反馈

请到 [Issues](https://github.com/Quark06/AutoDel/issues) 描述问题，附上 Discord、BetterDiscord 或 Kettu 的版本，以及复现步骤。请勿附带账号令牌（Token）或私人消息正文。

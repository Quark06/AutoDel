# AutoDel 开发路线（Development Roadmap）

本文件固定当前范围和推进顺序。产品规则变化时先更新本文件，再修改实现。

## 已确定的产品规则

- 按聊天开启（Per-channel Activation），账号之间也独立保存。
- 聊天界面显示 40×40 圆形计时图标按钮（Icon Button）；点击切换，激活后高亮，延时在设置页查看。
- 自动删除按钮常驻：回底按钮隐藏时占据其位置，出现时向上排列一格。
- 只处理激活之后、当前账号自己发送的新消息，不扫描历史消息。
- 从服务器确认的消息时间开始计算删除到期时间（Due Time）。
- 关闭聊天开关后，停止创建新任务，已安排任务继续执行。
- 全局预设延时（Default Delay）初始为 5 分钟；修改只影响新任务。
- 删除任务本地持久化（Persistence），不保存消息正文。
- 应用被终止时无法执行删除；启动或回到前台后处理已到期任务。
- 插件停用时停止运行，保留任务，重新启用后恢复。

## 最小框架（Minimal Scaffold）——本次交付

- [x] 独立核心（Core）：聊天开关、预设延时、账号隔离、待删除任务。
- [x] 删除调度器（Deletion Scheduler）：一个计时器，按到期时间执行，失败任务可手动重试。
- [x] Kettu 适配层（Adapter）：兼容接口、消息事件、删除调用、插件生命周期（Lifecycle）。
- [x] 原生界面（Native UI）代码：回底区域常驻图标按钮、设置页预设时长。
- [x] 浏览器演示（Browser Demo）：聊天 A/B、按钮高亮、发送和延时删除，共用核心逻辑。
- [x] 构建（Build）和本地服务（Local Server）入口。
- [x] 功能测试（Functional Testing）脚本和团队验收清单。
- [ ] 在目标手机上确认实际加载、悬浮按钮位置和真实消息删除。

“代码已提供”不表示已在手机完成兼容性验收（Compatibility Acceptance）。

## 下一阶段：Kettu 真机闭环（Device Integration）

1. 记录目标系统、Discord 和 Kettu 版本，安装本地构建产物。
2. 确认 ChatInputActions 渲染接入、当前聊天标识、MESSAGE_CREATE 事件格式。
3. 确认 deleteMessage 调用及异步结果，确保任务成功状态对应真实删除。
4. 团队专业测试人员执行 docs/TESTING.md 的真机功能清单。
5. 仅针对实际发现的问题调整接入点和按钮布局。

验收标准：在聊天 A 激活后，自己的新消息按预设删除；聊天 B 未激活的消息保留。

## 后续阶段：使用体验（User Experience）

真机闭环完成后，再实现自定义时长输入、失败原因展示、按钮位置调整。当前不加入批量历史清理、删除别人消息、多设备同步（Multi-device Sync）和后台常驻服务（Background Service）。

## 模块边界（Module Boundaries）

| 文件 | 职责 |
| --- | --- |
| src/shared/core.js | 共享核心（Shared Core）：规则、状态、任务保存和到期执行 |
| src/kettu/adapter.js | 客户端内部模块查询、消息订阅、删除调用和聊天界面接入 |
| src/kettu/ui.js | 原生悬浮按钮和插件设置页 |
| src/kettu/index.js | 插件生命周期，组合并释放以上模块 |
| src/kettu/manifest.json | Kettu 插件清单（Manifest） |
| src/betterdiscord/ | BetterDiscord 版本预留目录，尚未实现 |
| demo/ | 可操作的本地功能演示，不连接 Discord |
| scripts/ | 插件构建和本地服务 |
| tests/shared/ | 共享核心功能测试（Functional Testing） |
| tests/kettu/ | Kettu 插件加载测试 |

## 当前实现限制（Implementation Limits）

- 客户端内部模块随版本变化；所有相关名称集中在 src/kettu/adapter.js。
- 当前按 MESSAGE_CREATE 中当前账号作者判断新消息，可能包含同账号其他设备发送且本机收到的消息。只限本设备发送的精确筛选留待真机确认事件格式后决定。
- 本地演示持久化开关和任务，但演示消息只在当前页面内存中保存，刷新后的演示不用于验证消息恢复。
- 原生预设为 10 秒、1 分钟、5 分钟；演示额外提供 3 秒便于快速验收。
- 暂无自动重试（Automatic Retry），失败保留任务，通过设置页手动重试。

## 接口依据（API References）

- Kettu 兼容接口：https://github.com/C0C0B01/Kettu/blob/github/src/core/vendetta/api.tsx
- Kettu 插件加载：https://github.com/C0C0B01/Kettu/blob/github/src/core/vendetta/plugins.ts
- 插件构建模板：https://github.com/vendetta-mod/plugin-template/blob/master/build.mjs
- 聊天输入接入示例：https://github.com/kmmiio99o/vd-plugins/blob/main/plugins/ChatboxAvatar/src/index.tsx
- 消息事件示例：https://github.com/kmmiio99o/vd-plugins/blob/main/plugins/Moyai/src/index.ts

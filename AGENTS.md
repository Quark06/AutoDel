# 项目协作规则

## 沟通与测试

- 一切涉及专业知识的回答都要对专有名词做英文标注。
- 客户端测试由团队专业人员执行。验证改动时以功能测试（Functional tests）为主，以完成任务效率优先，不扩展不必要的边际情况检查。

## 用户文档

- `README.md` 面向插件用户，只保留功能、下载、安装、使用、更新和问题反馈等必要信息。
- README 可单独设置源码构建指南（Build guide）栏目，包含环境要求、构建命令、产物位置和本地安装步骤。
- 不在 README 中加入版本标签（Version tag）触发规则、发布工作流（Workflow）、测试流程或开发过程记录。
- 开发与发布规则保存在本文件；团队验收说明保存在 `docs/TESTING.md`。

## 版本与发布（Version and release）

- 当前版本为 `0.1.0`；版本号以 `package.json` 的 `version` 为准。
- BetterDiscord 只通过稳定版本标签（Version tag）触发自动发布，例如 `v0.1.0`。
- 标签格式为 `v主版本.次版本.修订版本`（如 `v0.1.0`），必须与该提交中 `package.json` 的版本号一致；不使用预发布后缀（Prerelease suffix）。
- 普通提交（Commit）和推送（Push）不创建 BetterDiscord Release。不要恢复每次推送到 `main` 就发布的方式。
- 工作流（Workflow）为 `.github/workflows/betterdiscord-release.yml`：检出标签对应代码，验证版本，构建 BetterDiscord，执行功能测试，将 `AutoDel.plugin.js` 上传到同名 GitHub Release。
- 稳定版本由用户确认。不要因普通代码改动自行升级版本号、创建或推送发布标签。
- Kettu 保持独立发布：推送到 `main` 后由 `.github/workflows/pages.yml` 更新 GitHub Pages，不受 BetterDiscord 标签发布规则影响。

## 稳定版本发布步骤

1. 确认版本已完成所需功能验收（Functional acceptance）。
2. 将 `package.json` 和 `package-lock.json` 中的项目版本保持一致，并提交发布所需改动。
3. 将包含发布工作流及版本信息的提交推送到远程 `main`。
4. 在已确认稳定的提交上创建并推送对应标签。当前 `0.1.0` 的命令为：

   ```powershell
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push origin v0.1.0
   ```

5. 查看 GitHub Actions 结果，确认 Releases 中附带 `AutoDel.plugin.js`。

创建标签不等于自动判定版本稳定；仅在用户明确授权发布该版本后执行上述发布操作。

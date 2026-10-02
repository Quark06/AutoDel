import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const { version } = JSON.parse(await readFile("package.json", "utf8"));
const result = await build({
    entryPoints: ["src/betterdiscord/index.js"], bundle: true, write: false,
    format: "iife", globalName: "AutoDelBundle", target: "es2020"
});
const meta = `/**
 * @name AutoDel
 * @author AutoDel contributors
 * @version ${version}
 * @description 按聊天开启，定时删除自己发送的新消息。
 */`;
await mkdir("dist/betterdiscord", { recursive: true });
await writeFile("dist/betterdiscord/AutoDel.plugin.js",
    `${meta}\n${result.outputFiles[0].text}\nmodule.exports = AutoDelBundle.default;\n`);
console.log("Built dist/betterdiscord/AutoDel.plugin.js");

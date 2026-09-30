import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const result = await build({
    entryPoints: ["src/kettu/index.js"], bundle: true, write: false,
    format: "iife", globalName: "AutoDelBundle", target: "es2020"
});
// Plugin loader expects an expression which returns the lifecycle object.
const code = `(function(){\n${result.outputFiles[0].text}\nreturn AutoDelBundle.default;})()`;
const manifest = JSON.parse(await readFile("src/kettu/manifest.json", "utf8"));
manifest.hash = createHash("sha256").update(code).digest("hex");
await mkdir("dist/autodel", { recursive: true });
await writeFile("dist/autodel/index.js", code);
await writeFile("dist/autodel/manifest.json", JSON.stringify(manifest, null, 2));
console.log("Built dist/autodel: index.js + manifest.json");

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

const root = resolve("dist");
const port = Number(process.env.PORT ?? 5173);
createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (pathname === "/") {
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }).end(
            "AutoDel 安装文件服务\nKettu: /dist/autodel/\nBetterDiscord: /dist/betterdiscord/AutoDel.plugin.js\n"
        );
        return;
    }
    if (!pathname.startsWith("/dist/")) {
        res.writeHead(404).end(); return;
    }
    const path = resolve(root, `.${pathname.slice(5)}`);
    if (!path.startsWith(root + sep)) {
        res.writeHead(404).end(); return;
    }
    try {
        const content = await readFile(path);
        const type = path.endsWith(".json") ? "application/json" : "text/javascript";
        res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" }).end(content);
    } catch { res.writeHead(404).end("Not found"); }
}).listen(port, "0.0.0.0", () => {
    console.log(`安装文件服务: http://localhost:${port}/`);
    console.log(`Kettu 插件地址: http://<电脑局域网IP>:${port}/dist/autodel/`);
});

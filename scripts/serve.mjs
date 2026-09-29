import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

const root = resolve(".");
const port = Number(process.env.PORT ?? 5173);
createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const path = resolve(root, `.${pathname === "/" ? "/demo/index.html" : pathname}`);
    if (!path.startsWith(root + sep) || !["demo", "src", "dist"].some(dir => path.startsWith(resolve(root, dir) + sep))) {
        res.writeHead(404).end(); return;
    }
    try {
        const content = await readFile(path);
        const type = path.endsWith(".html") ? "text/html; charset=utf-8" : path.endsWith(".json") ? "application/json" : "text/javascript";
        res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" }).end(content);
    } catch { res.writeHead(404).end("Not found"); }
}).listen(port, "0.0.0.0", () => {
    console.log(`功能演示: http://localhost:${port}/`);
    console.log(`Kettu 插件地址: http://<电脑局域网IP>:${port}/dist/autodel/`);
});

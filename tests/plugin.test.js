import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { createHash } from "node:crypto";

test("构建产物可由 Kettu 加载协议执行，卸载会释放订阅和补丁", {
    skip: !existsSync("dist/autodel/index.js") && "先运行 npm run build 可验证插件构建产物"
}, () => {
    const subscriptions = new Map();
    let patched = false;
    let resumed = false;
    let renderOverlay;
    const target = { default() {} };
    const api = {
        plugin: { storage: {} }, logger: { error() {} },
        ui: { assets: { getAssetIDByName: () => 42 } },
        metro: {
            findByStoreName: name => name === "UserStore"
                ? { getCurrentUser: () => ({ id: "self" }) }
                : { getChannelId: () => "A" },
            findByProps: (...props) => props.includes("Stack")
                ? { Stack: "Stack" }
                : { sendMessage() {}, deleteMessage: async () => {} },
            findByName: (name, defaultExport) => {
                assert.equal(name, "JumpToPresentButton");
                assert.equal(defaultExport, false);
                return target;
            },
            common: {
                React: {
                    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
                    cloneElement: (element, props, children) => ({ ...element, props: { ...element.props, ...props, children } })
                },
                ReactNative: { AppState: { addEventListener() {
                    resumed = true; return { remove() { resumed = false; } };
                } } },
                FluxDispatcher: {
                    subscribe: (name, fn) => subscriptions.set(name, fn),
                    unsubscribe: name => subscriptions.delete(name)
                }
            }
        },
        patcher: { after(method, module, callback) {
            assert.equal(method, "default");
            assert.equal(module, target);
            renderOverlay = callback;
            patched = true;
            return () => { patched = false; };
        } }
    };
    const code = readFileSync("dist/autodel/index.js", "utf8");
    const manifest = JSON.parse(readFileSync("dist/autodel/manifest.json", "utf8"));
    assert.equal(manifest.hash, createHash("sha256").update(code).digest("hex"));
    const plugin = runInNewContext(`(vendetta => { return ${code}\n})`, {
        setTimeout: () => 1, clearTimeout() {}, console
    })(api);
    assert.equal(typeof plugin.settings, "function");
    plugin.onLoad();
    assert.equal(patched, true);
    assert.equal(resumed, true);
    assert.equal(subscriptions.has("MESSAGE_CREATE"), true);
    const originalButton = { props: { icon: 42 } };
    const original = { type: "Overlay", props: { children: originalButton } };
    const overlay = renderOverlay([{ channelId: "A" }], original);
    assert.equal(overlay.type, "Overlay");
    assert.equal(overlay.props.children.type, "Stack");
    assert.equal(overlay.props.children.props.children[0].props.channelId, "A");
    assert.equal(overlay.props.children.props.children[1], originalButton);
    plugin.onUnload();
    assert.equal(patched, false);
    assert.equal(resumed, false);
    assert.equal(subscriptions.size, 0);
});

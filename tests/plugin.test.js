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
                    useState: () => [0, () => {}],
                    useEffect() {},
                    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
                    cloneElement: (element, props, children) => ({ ...element, props: { ...element.props, ...props, children } })
                },
                ReactNative: { View: "View", Text: "Text", Pressable: "Pressable",
                    StyleSheet: { flatten: style => style }, AppState: { addEventListener() {
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
    const initialBottom = renderOverlay([{ channelId: "A" }], null);
    assert.equal(initialBottom.type, "View");
    assert.equal(initialBottom.props.children[0].props.children[0].props.raised, false);
    const originalButton = { props: { icon: 42 } };
    const original = { type: "Overlay", props: {
        style: { bottom: 24, right: 12, opacity: 0 }, children: originalButton
    } };
    const overlay = renderOverlay([{ channelId: "A" }], original);
    assert.equal(overlay.type, "View");
    assert.equal(overlay.props.style.bottom, 24);
    assert.equal(overlay.props.style.right, 12);
    assert.equal(overlay.props.style.opacity, undefined);
    const stack = overlay.props.children[0];
    assert.equal(stack.type, "Stack");
    assert.equal(stack.props.children[0].props.channelId, "A");
    assert.equal(stack.props.children[0].props.raised, true);
    assert.equal(stack.props.children[1], originalButton);
    const buttonElement = stack.props.children[0];
    const button = buttonElement.type(buttonElement.props);
    assert.equal(button.props.style.width, 40);
    assert.equal(button.props.style.height, 40);
    assert.equal(button.props.style.marginBottom, 8);
    assert.equal(button.props.children[0].props.children[0], "⏱");
    button.props.onPress();
    assert.equal(api.plugin.storage.state.accounts.self.channels.A.enabled, true);
    assert.equal(buttonElement.type(buttonElement.props).props.style.backgroundColor, "#5865F2");
    const atBottom = renderOverlay([{ channelId: "A" }], null);
    assert.equal(atBottom.props.style.bottom, 24);
    assert.equal(atBottom.props.children[0].props.children[0].props.raised, false);
    assert.equal(atBottom.props.children[0].props.children[1], undefined);
    const loweredButton = atBottom.props.children[0].props.children[0];
    assert.equal(loweredButton.type(loweredButton.props).props.style.marginBottom, 0);
    plugin.onUnload();
    assert.equal(patched, false);
    assert.equal(resumed, false);
    assert.equal(subscriptions.size, 0);
});

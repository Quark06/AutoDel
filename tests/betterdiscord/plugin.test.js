import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

test("BetterDiscord 单文件加载、聊天开关、删除、恢复和卸载", {
    skip: !existsSync("dist/betterdiscord/AutoDel.plugin.js") && "先运行 npm run build:betterdiscord"
}, async () => {
    class Element {
        constructor(tag) { this.tagName = tag; this.children = []; this.style = {}; this.dataset = {}; this.attributes = {}; this.isConnected = true; }
        append(...children) { this.children.push(...children); }
        remove() { this.isConnected = false; }
        contains(target) { return this.children.includes(target); }
        setAttribute(key, value) { this.attributes[key] = value; }
    }
    const subscriptions = new Map();
    const userListeners = new Set();
    const channelListeners = new Set();
    const windowListeners = new Map();
    const documentListeners = new Map();
    const styles = new Map();
    const observers = new Set();
    const deleted = [];
    let channelId = "A";
    let saved;
    let fail = false;
    let clock = 1000;
    const timers = new Map();
    let nextTimer = 0;
    const body = new Element("body");
    let showJump = false;
    const jump = { getBoundingClientRect: () => ({ width: 600, height: 24, top: 460 }) };
    const scroller = {
        getBoundingClientRect: () => ({ width: 600, height: 500, right: 800, bottom: 500 }),
        parentElement: { querySelector: () => showJump ? jump : null }
    };
    const document = { body, hidden: false,
        createElement: tag => new Element(tag),
        querySelector: () => ({ closest: () => scroller }),
        addEventListener: (name, fn) => documentListeners.set(name, fn),
        removeEventListener: name => documentListeners.delete(name)
    };
    const users = { getCurrentUser: () => ({ id: "self" }),
        addChangeListener: fn => userListeners.add(fn), removeChangeListener: fn => userListeners.delete(fn) };
    const channels = { getChannelId: () => channelId,
        addChangeListener: fn => channelListeners.add(fn), removeChangeListener: fn => channelListeners.delete(fn) };
    const dispatcher = {
        subscribe: (name, fn) => subscriptions.set(name, fn), unsubscribe: name => subscriptions.delete(name)
    };
    class BdApi {
        constructor(name) {
            assert.equal(name, "AutoDel");
            this.Webpack = {
                getStore: name => name === "UserStore" ? users : channels,
                getByKeys: (...args) => {
                    // Model named exports, with no sendMessage on the deletion module.
                    const options = args.at(-1);
                    if (typeof options !== "object" || !options.searchExports) return undefined;
                    return args.includes("deleteMessage")
                        ? { deleteMessage: async (...ids) => { if (fail) throw new Error("删除失败"); deleted.push(ids); } }
                        : dispatcher;
                }
            };
            this.Data = { load: () => saved, save: (_key, state) => { saved = JSON.parse(JSON.stringify(state)); } };
            this.DOM = { addStyle: (key, css) => styles.set(key, css), removeStyle: key => styles.delete(key) };
            this.Logger = { error() {} };
        }
    }
    const module = { exports: {} };
    class ClockDate extends Date { static now() { return clock; } }
    runInNewContext(readFileSync("dist/betterdiscord/AutoDel.plugin.js", "utf8"), {
        module, BdApi, document, Date: ClockDate,
        window: { addEventListener: (name, fn) => windowListeners.set(name, fn), removeEventListener: name => windowListeners.delete(name) },
        MutationObserver: class { observe() { observers.add(this); } disconnect() { observers.delete(this); } },
        getComputedStyle: () => ({ visibility: "visible", opacity: "1" }),
        requestAnimationFrame: fn => { timers.set(++nextTimer, fn); return nextTimer; },
        cancelAnimationFrame: id => timers.delete(id),
        setTimeout: fn => { timers.set(++nextTimer, fn); return nextTimer; },
        clearTimeout: id => timers.delete(id), console
    });
    const plugin = new module.exports();
    plugin.start();
    await plugin.core.flush();
    const button = body.children.at(-1);
    assert.equal(button.hidden, false);
    assert.equal(button.style.top, "444px");
    const drainFrames = () => { for (const [id, fn] of [...timers]) { timers.delete(id); fn(); } };
    button.onclick();
    drainFrames();
    assert.equal(button.attributes["aria-pressed"], "true");
    showJump = true;
    plugin.ui.render(); drainFrames();
    assert.equal(button.style.top, "412px");
    const panel = plugin.getSettingsPanel();
    const select = panel.children[1].children[0];
    select.value = "10000"; select.onchange();
    const send = (id, author = "self") => subscriptions.get("MESSAGE_CREATE")({
        message: { id, author: { id: author }, channel_id: channelId, timestamp: new Date(clock).toISOString() }
    });
    send("own"); send("other", "other");
    channelId = "B"; send("disabled");
    assert.equal(plugin.core.getSnapshot("B").enabled, false);
    channelId = "A"; button.onclick();
    send("after-off");
    clock += 10000;
    await plugin.core.flush();
    assert.deepEqual(deleted, [["A", "own"]]);
    button.onclick(); send("restore");
    plugin.stop();
    assert.equal(button.isConnected, false);
    assert.equal(subscriptions.size + userListeners.size + channelListeners.size + styles.size + observers.size, 0);
    assert.equal(windowListeners.size + documentListeners.size, 0);
    clock += 10000; fail = true;
    plugin.start(); await plugin.core.flush();
    assert.equal(plugin.core.getSnapshot("A").failed, 1);
    fail = false;
    const restoredPanel = plugin.getSettingsPanel();
    restoredPanel.children[3].onclick();
    // Wait for the deletion initiated by the settings retry button.
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(deleted, [["A", "own"], ["A", "restore"]]);
    assert.equal(plugin.core.getSnapshot("A").pending, 0);
    plugin.stop();
    assert.equal(saved.accounts.self.channels.A.enabled, true);
});

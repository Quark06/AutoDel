import { chatSelectors } from "./adapter.js";

const css = `
#autodel-chat-button { position:fixed; z-index:100; width:40px; height:40px;
    border:0; border-radius:50%; background:var(--background-floating,#383a40);
    color:var(--text-normal,#fff); font-size:22px; cursor:pointer;
    box-shadow:0 2px 8px #0005; }
#autodel-chat-button[data-enabled="true"] { background:#5865f2; color:#fff; }
#autodel-chat-button:focus-visible { outline:2px solid #5865f2; outline-offset:3px; }
.autodel-settings { color:var(--text-normal,#f2f3f5); padding:16px; }
.autodel-settings select, .autodel-settings button { padding:8px 12px; margin:8px;
    color:#f2f3f5 !important; background:#2b2d31 !important;
    border:1px solid #80848e !important; border-radius:4px; font:inherit;
    min-height:36px; color-scheme:dark; }
.autodel-settings select { min-width:160px; cursor:pointer; }
.autodel-settings select option { color:#f2f3f5; background:#2b2d31; }
.autodel-settings button { cursor:pointer; }
.autodel-settings button:hover:not(:disabled) { background:#404249 !important; }
.autodel-settings button:disabled { color:#b5bac1 !important; cursor:not-allowed; opacity:1; }
.autodel-settings select:focus-visible, .autodel-settings button:focus-visible {
    outline:2px solid #5865f2; outline-offset:2px; }
`;

export function createUI(api, adapter, core) {
    let button;
    let observer;
    let frame;
    let unsubscribe;
    let settingsCleanup;
    let settingsUpdate;
    const setText = (element, text) => { if (element.textContent !== text) element.textContent = text; };
    function render() {
        settingsUpdate?.();
        if (!button) return;
        const channelId = adapter.getChannelId();
        const list = document.querySelector(chatSelectors.messages);
        const scroller = list?.closest(chatSelectors.scroller) ?? list;
        const rect = scroller?.getBoundingClientRect();
        button.hidden = !channelId || !rect || rect.width === 0 || rect.height === 0;
        if (button.hidden) return;
        const snapshot = core.getSnapshot(channelId);
        button.dataset.enabled = String(snapshot.enabled);
        button.setAttribute("aria-pressed", String(snapshot.enabled));
        button.setAttribute("aria-label", snapshot.enabled ? "关闭自动删除" : "开启自动删除");
        button.title = `自动删除${snapshot.enabled ? "已开启" : "已关闭"} · ${snapshot.delayMs / 1000} 秒`;
        const chat = scroller.parentElement;
        const jump = chat?.querySelector(chatSelectors.jump);
        const jumpRect = jump?.getBoundingClientRect();
        const visibleJump = jumpRect?.width > 0 && jumpRect.height > 0 &&
            getComputedStyle(jump).visibility !== "hidden" && getComputedStyle(jump).opacity !== "0";
        button.style.left = `${rect.right - 56}px`;
        button.style.top = `${visibleJump ? jumpRect.top - 48 : rect.bottom - 56}px`;
    }
    function scheduleRender() {
        if (frame !== undefined) return;
        frame = requestAnimationFrame(() => { frame = undefined; render(); });
    }
    return {
        render: scheduleRender,
        mount() {
            api.DOM.addStyle("ui", css);
            button = document.createElement("button");
            button.id = "autodel-chat-button";
            button.type = "button";
            button.textContent = "⏱";
            button.hidden = true;
            button.onclick = () => {
                const channelId = adapter.getChannelId();
                if (channelId) core.toggle(channelId);
            };
            document.body.append(button);
            observer = new MutationObserver(records => {
                if (records.some(record => record.target !== button && !button.contains(record.target))) scheduleRender();
            });
            observer.observe(document.body, { childList: true, subtree: true,
                attributes: true, attributeFilter: ["class", "style", "hidden"] });
            window.addEventListener("resize", scheduleRender);
            document.addEventListener("scroll", scheduleRender, true);
            unsubscribe = core.subscribe(scheduleRender);
            render();
        },
        unmount() {
            observer?.disconnect();
            if (frame !== undefined) cancelAnimationFrame(frame);
            frame = undefined;
            window.removeEventListener("resize", scheduleRender);
            document.removeEventListener("scroll", scheduleRender, true);
            unsubscribe?.();
            settingsCleanup?.();
            button?.remove();
            button = undefined;
            api.DOM.removeStyle("ui");
        },
        settings() {
            settingsCleanup?.();
            const panel = document.createElement("div");
            panel.className = "autodel-settings";
            const heading = document.createElement("h3");
            heading.textContent = "AutoDel 自动删除";
            const label = document.createElement("label");
            label.textContent = "新消息删除延时";
            const select = document.createElement("select");
            for (const [value, text] of [
                [10000, "10 秒（测试）"], [60000, "1 分钟"], [300000, "5 分钟"],
                [600000, "10 分钟"], [1200000, "20 分钟"], [1800000, "30 分钟"]
            ]) {
                const option = document.createElement("option");
                option.value = String(value); option.textContent = text; select.append(option);
            }
            select.onchange = () => core.setDelay(Number(select.value));
            label.append(select);
            const status = document.createElement("p");
            const retry = document.createElement("button");
            retry.type = "button"; retry.textContent = "重试失败任务";
            retry.onclick = () => { core.retryFailed(); void core.flush(); };
            const note = document.createElement("p");
            note.textContent = "按聊天开启，只删除开启后自己发送的新消息。关闭开关后，已排队消息继续删除；修改延时只影响新消息。Discord 关闭期间无法删除，重新启用后补处理。";
            panel.append(heading, label, status, retry, note);
            const update = () => {
                const snapshot = core.getSnapshot(adapter.getChannelId());
                select.value = String(snapshot.delayMs);
                setText(status, `当前账号待删除：${snapshot.pending} · 失败：${snapshot.failed}`);
                retry.disabled = snapshot.failed === 0;
            };
            const dispose = core.subscribe(update);
            // Settings DOM can be detached by BetterDiscord without a plugin stop.
            const watch = new MutationObserver(() => {
                if (!panel.isConnected) { dispose(); watch.disconnect(); }
            });
            const settingsFrame = requestAnimationFrame(() => {
                if (panel.isConnected) watch.observe(document.body, { childList: true, subtree: true });
                else dispose();
            });
            settingsUpdate = update;
            settingsCleanup = () => {
                cancelAnimationFrame(settingsFrame);
                dispose(); watch.disconnect(); settingsUpdate = undefined;
            };
            update();
            return panel;
        }
    };
}

import { createAutoDel } from "/src/shared/core.js";
let channelId = "A";
const messages = [];
const core = createAutoDel({
    load: () => JSON.parse(localStorage.getItem("autodel-demo") ?? "null"),
    save: state => localStorage.setItem("autodel-demo", JSON.stringify(state)),
    getAccountId: () => "demo-account",
    deleteMessage: async (_channelId, messageId) => {
        const index = messages.findIndex(message => message.id === messageId);
        if (index !== -1) messages.splice(index, 1);
        render();
    }
});
function render() {
    const snapshot = core.getSnapshot(channelId);
    document.querySelector("#title").textContent = `聊天 ${channelId}`;
    document.querySelector("#toggle").textContent = snapshot.enabled ? `自动删除 · ${snapshot.delayMs / 1000}秒` : "自动删除 · 关闭";
    document.querySelector("#toggle").classList.toggle("active", snapshot.enabled);
    document.querySelector("#status").textContent = `待删除：${snapshot.pending} | 失败：${snapshot.failed}`;
    document.querySelector("#delay").value = snapshot.delayMs;
    document.querySelector("#messages").replaceChildren(...messages.filter(m => m.channelId === channelId).map(message => {
        const element = document.createElement("div");
        element.className = "message";
        element.textContent = message.content;
        return element;
    }));
}
document.querySelectorAll("[data-channel]").forEach(button => button.onclick = () => { channelId = button.dataset.channel; render(); });
document.querySelector("#toggle").onclick = () => core.toggle(channelId);
document.querySelector("#delay").onchange = event => core.setDelay(Number(event.target.value));
document.querySelector("form").onsubmit = event => {
    event.preventDefault();
    const input = document.querySelector("#content");
    const id = crypto.randomUUID();
    messages.push({ id, channelId, content: input.value });
    core.acceptMessage({ accountId: "demo-account", authorId: "demo-account", channelId, messageId: id, sentAt: Date.now() });
    input.value = "";
    render();
};
if (!localStorage.getItem("autodel-demo")) core.setDelay(3000);
core.subscribe(render);
core.start();
render();

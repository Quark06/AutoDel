// Discord internal module names and chat selectors are centralized here.
export const chatSelectors = {
    messages: '[data-list-id="chat-messages"]',
    scroller: '[class*="scroller_"]',
    jump: '[class*="jumpToPresentBar_"]'
};

export function createBetterDiscordAdapter(api) {
    const users = api.Webpack.getStore("UserStore");
    const channels = api.Webpack.getStore("SelectedChannelStore");
    // Desktop actions can be nested named exports; sending is not required for deletion.
    const messages = api.Webpack.getByKeys("deleteMessage") ??
        api.Webpack.getByKeys("deleteMessage", { searchExports: true });
    const dispatcher = api.Webpack.getByKeys("dispatch", "subscribe", "unsubscribe") ??
        api.Webpack.getByKeys("dispatch", "subscribe", "unsubscribe", { searchExports: true });
    const missing = [
        ["UserStore.getCurrentUser", typeof users?.getCurrentUser === "function"],
        ["SelectedChannelStore.getChannelId", typeof channels?.getChannelId === "function"],
        ["MessageActions.deleteMessage", typeof messages?.deleteMessage === "function"],
        ["FluxDispatcher", typeof dispatcher?.subscribe === "function" && typeof dispatcher?.unsubscribe === "function"]
    ].filter(([, found]) => !found).map(([name]) => name);
    if (missing.length) {
        throw new Error(`AutoDel：未找到 Discord 接口（API）：${missing.join(", ")}。请提供此完整错误及 Discord / BetterDiscord 版本。`);
    }
    return {
        getAccountId: () => users.getCurrentUser()?.id ?? "",
        getChannelId: () => channels.getChannelId(),
        load: () => api.Data.load("state"),
        save: state => api.Data.save("state", state),
        deleteMessage: (channelId, messageId) => messages.deleteMessage(channelId, messageId),
        listen(core, onChange) {
            const onMessage = event => {
                const message = event.message;
                if (!message?.id || message.state || !message.author?.id) return;
                const channelId = message.channel_id ?? event.channelId;
                const sentAt = new Date(message.timestamp).getTime();
                if (!channelId || !Number.isFinite(sentAt)) return;
                core.acceptMessage({ accountId: users.getCurrentUser()?.id,
                    authorId: message.author.id, channelId, messageId: message.id, sentAt });
            };
            const onStoreChange = () => { onChange(); void core.flush(); };
            const onResume = () => { if (!document.hidden) onStoreChange(); };
            dispatcher.subscribe("MESSAGE_CREATE", onMessage);
            users.addChangeListener(onStoreChange);
            channels.addChangeListener(onStoreChange);
            window.addEventListener("focus", onStoreChange);
            document.addEventListener("visibilitychange", onResume);
            return () => {
                dispatcher.unsubscribe("MESSAGE_CREATE", onMessage);
                users.removeChangeListener(onStoreChange);
                channels.removeChangeListener(onStoreChange);
                window.removeEventListener("focus", onStoreChange);
                document.removeEventListener("visibilitychange", onResume);
            };
        }
    };
}

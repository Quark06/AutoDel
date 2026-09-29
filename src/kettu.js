// All Discord internal module names live here; confirm these on the target mobile version.
export function createKettuAdapter(api) {
    const { metro } = api;
    const { React, ReactNative, FluxDispatcher } = metro.common;
    const users = metro.findByStoreName("UserStore");
    const channels = metro.findByStoreName("SelectedChannelStore");
    const messages = metro.findByProps("sendMessage", "deleteMessage");
    // Same chat overlay entry point used by tralwdwd/plugins JumpToTop.
    // https://github.com/tralwdwd/plugins/blob/master/plugins/JumpToTop/src/patches/jumptopresent.tsx
    const target = metro.findByName("JumpToPresentButton", false);
    const { Stack } = metro.findByProps("Stack", "Button", "Text") ?? {};
    if (!users || !channels || !messages || typeof target?.default !== "function" || !Stack) {
        throw new Error("AutoDel: 未找到聊天接入模块，请记录 Discord / Kettu 版本。");
    }
    return {
        React, ReactNative,
        getAccountId: () => users.getCurrentUser()?.id ?? "",
        getChannelId: () => channels.getChannelId?.() ?? channels.getCurrentlySelectedChannelId?.(),
        deleteMessage: (channelId, messageId) => messages.deleteMessage(channelId, messageId),
        listen(core) {
            const onMessage = event => {
                const message = event.message;
                // Optimistic messages have a state; only server-confirmed MESSAGE_CREATE is accepted.
                if (!message?.id || message.state || !message.author?.id) return;
                const sentAt = new Date(message.timestamp).getTime();
                if (!Number.isFinite(sentAt)) return;
                core.acceptMessage({
                    accountId: users.getCurrentUser()?.id,
                    authorId: message.author.id,
                    channelId: message.channel_id ?? event.channelId,
                    messageId: message.id,
                    sentAt
                });
            };
            FluxDispatcher.subscribe("MESSAGE_CREATE", onMessage);
            const resume = ReactNative.AppState.addEventListener("change", state => {
                if (state === "active") void core.flush();
            });
            return () => {
                FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessage);
                resume.remove();
            };
        },
        mountButton(Button) {
            const arrowIcon = api.ui.assets.getAssetIDByName("ArrowLargeDownIcon");
            return api.patcher.after("default", target, ([{ channelId }], original) => {
                if (original == null) return;
                const jumpToPresentButton = original.props?.children;
                // Preserve the voice-chat close button, as JumpToTop does.
                if (jumpToPresentButton?.props?.icon !== arrowIcon) return;
                return React.cloneElement(original, undefined,
                    React.createElement(Stack, null,
                        React.createElement(Button, { channelId }), jumpToPresentButton));
            });
        }
    };
}

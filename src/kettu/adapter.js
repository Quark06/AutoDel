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
            const positions = new Map();
            const unpatch = api.patcher.after("default", target, ([{ channelId }], original) => {
                const jumpToPresentButton = original?.props?.children;
                // Preserve the voice-chat close button, as JumpToTop does.
                if (jumpToPresentButton && jumpToPresentButton.props?.icon !== arrowIcon) return;
                if (original) {
                    const nativeStyle = ReactNative.StyleSheet.flatten(original.props?.style) ?? {};
                    const position = { ...positions.get(channelId) };
                    // Reuse native placement, without its visibility/animation styles.
                    for (const key of ["bottom", "right", "left", "top", "paddingBottom", "paddingRight", "marginBottom", "marginRight"]) {
                        if (typeof nativeStyle[key] === "number") position[key] = nativeStyle[key];
                    }
                    positions.set(channelId, position);
                }
                return React.createElement(ReactNative.View, {
                    pointerEvents: "box-none",
                    style: { position: "absolute", bottom: 65, right: 16,
                        ...positions.get(channelId), zIndex: 100, alignItems: "flex-end" }
                }, React.createElement(Stack, { style: { alignItems: "flex-end" } },
                    React.createElement(Button, { channelId, raised: Boolean(jumpToPresentButton) }),
                    jumpToPresentButton));
            });
            return () => { unpatch(); positions.clear(); };
        }
    };
}

export function createUI(adapter, getCore) {
    const { React, ReactNative } = adapter;
    const { View, Text, Pressable } = ReactNative;
    function useSnapshot(channelId) {
        const core = getCore();
        const [, update] = React.useState(0);
        React.useEffect(() => core.subscribe(() => update(n => n + 1)), [core]);
        return core.getSnapshot(channelId);
    }
    function FloatingButton({ channelId = adapter.getChannelId() }) {
        const snapshot = useSnapshot(channelId);
        if (!channelId) return null;
        return React.createElement(Pressable, {
            accessibilityRole: "button",
            accessibilityLabel: snapshot.enabled ? "关闭自动删除" : "开启自动删除",
            onPress: () => getCore().toggle(channelId),
            style: { alignSelf: "flex-end", marginBottom: 8,
                paddingVertical: 10, paddingHorizontal: 14, borderRadius: 24,
                backgroundColor: snapshot.enabled ? "#5865F2" : "#383A40", elevation: 6 }
        }, React.createElement(Text, { style: { color: "white", fontWeight: "600" } },
            snapshot.enabled ? `自动删除 · ${snapshot.delayMs / 1000}秒` : "自动删除 · 关闭"));
    }
    function Settings() {
        const snapshot = useSnapshot(adapter.getChannelId());
        return React.createElement(View, { style: { padding: 20, gap: 12 } },
            React.createElement(Text, { style: { color: "#b5bac1" } }, "删除延时：只影响之后发送的新消息"),
            ...[10, 60, 300].map(seconds => React.createElement(Pressable, {
                key: seconds, onPress: () => getCore().setDelay(seconds * 1000),
                style: { padding: 12, borderRadius: 8,
                    backgroundColor: snapshot.delayMs === seconds * 1000 ? "#5865F2" : "#383A40" }
            }, React.createElement(Text, { style: { color: "white" } }, `${seconds} 秒`))),
            React.createElement(Text, { style: { color: "#b5bac1" } },
                `当前账号待删除：${snapshot.pending}，失败：${snapshot.failed}`),
            React.createElement(Pressable, { onPress: () => getCore().retryFailed(), style: { padding: 12 } },
                React.createElement(Text, { style: { color: "#b5bac1" } }, "重试失败任务")));
    }
    return { FloatingButton, Settings };
}

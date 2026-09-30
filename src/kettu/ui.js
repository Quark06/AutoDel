export function createUI(adapter, getCore) {
    const { React, ReactNative } = adapter;
    const { View, Text, Pressable } = ReactNative;
    function useSnapshot(channelId) {
        const core = getCore();
        const [, update] = React.useState(0);
        React.useEffect(() => core.subscribe(() => update(n => n + 1)), [core]);
        return core.getSnapshot(channelId);
    }
    function FloatingButton({ channelId = adapter.getChannelId(), raised = false }) {
        const snapshot = useSnapshot(channelId);
        if (!channelId) return null;
        return React.createElement(Pressable, {
            accessibilityRole: "button",
            accessibilityLabel: snapshot.enabled ? "关闭自动删除" : "开启自动删除",
            accessibilityHint: `删除延时 ${snapshot.delayMs / 1000} 秒`,
            accessibilityState: { selected: snapshot.enabled },
            onPress: () => getCore().toggle(channelId),
            style: { alignSelf: "flex-end", marginBottom: raised ? 8 : 0,
                width: 40, height: 40, borderRadius: 20,
                alignItems: "center", justifyContent: "center",
                backgroundColor: snapshot.enabled ? "#5865F2" : "#383A40", elevation: 6 }
        }, React.createElement(Text, { style: { color: "white", fontSize: 22 } }, "⏱"));
    }
    function Settings() {
        const snapshot = useSnapshot(adapter.getChannelId());
        return React.createElement(View, { style: { padding: 20, gap: 12 } },
            React.createElement(Text, { style: { color: "#b5bac1" } }, "删除延时：只影响之后发送的新消息"),
            ...[[60, "1 分钟"], [300, "5 分钟"], [600, "10 分钟"],
                [900, "15 分钟"], [1800, "30 分钟"], [10, "10 秒（开发调试）"]]
                .map(([seconds, label]) => React.createElement(Pressable, {
                key: seconds, onPress: () => getCore().setDelay(seconds * 1000),
                style: { padding: 12, borderRadius: 8,
                    backgroundColor: snapshot.delayMs === seconds * 1000 ? "#5865F2" : "#383A40" }
            }, React.createElement(Text, { style: { color: "white" } }, label))),
            React.createElement(Text, { style: { color: "#b5bac1" } },
                `当前账号待删除：${snapshot.pending}，失败：${snapshot.failed}`),
            React.createElement(Pressable, { onPress: () => getCore().retryFailed(), style: { padding: 12 } },
                React.createElement(Text, { style: { color: "#b5bac1" } }, "重试失败任务")));
    }
    return { FloatingButton, Settings };
}

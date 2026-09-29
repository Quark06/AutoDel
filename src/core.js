export function createAutoDel({ load, save, deleteMessage, getAccountId, now = Date.now,
    setTimer = setTimeout, clearTimer = clearTimeout, onError = console.error }) {
    let state = load() ?? { version: 1, delayMs: 300000, accounts: {} };
    let timer;
    let running = false;
    let busy = false;
    const listeners = new Set();
    const account = id => state.accounts[id] ??= { channels: {}, tasks: [] };
    const publish = () => {
        // Replace the root value so both browser storage and Kettu storage observe writes.
        save(JSON.parse(JSON.stringify(state)));
        listeners.forEach(listener => listener());
    };
    function arm() {
        clearTimer(timer);
        if (!running || busy) return;
        const tasks = account(getAccountId()).tasks.filter(task => task.status === "pending");
        // Periodic wake also notices account changes while the app is running.
        const wait = tasks.length ? Math.min(30000, Math.max(0, Math.min(...tasks.map(t => t.dueAt)) - now())) : 30000;
        timer = setTimer(() => { void flush(); }, wait);
    }
    async function flush() {
        if (!running || busy) return;
        busy = true;
        const id = getAccountId();
        const tasks = account(id).tasks;
        const due = tasks.filter(task => task.status === "pending" && task.dueAt <= now());
        try {
            for (const task of due) {
                if (!running || getAccountId() !== id) break;
                try {
                    await deleteMessage(task.channelId, task.messageId);
                    const index = tasks.indexOf(task);
                    if (index !== -1) tasks.splice(index, 1);
                } catch (error) {
                    task.status = "failed";
                    onError(error);
                }
                publish();
            }
        } finally {
            busy = false;
            arm();
        }
    }
    return {
        start() { running = true; arm(); },
        stop() { running = false; clearTimer(timer); },
        subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
        getSnapshot(channelId) {
            const data = account(getAccountId());
            return {
                enabled: Boolean(data.channels[channelId]?.enabled),
                delayMs: state.delayMs,
                pending: data.tasks.filter(t => t.status === "pending").length,
                failed: data.tasks.filter(t => t.status === "failed").length
            };
        },
        toggle(channelId) {
            const channels = account(getAccountId()).channels;
            const enabled = !channels[channelId]?.enabled;
            channels[channelId] = { enabled, activatedAt: now() };
            publish();
            return enabled;
        },
        setDelay(delayMs) {
            if (!Number.isFinite(delayMs) || delayMs <= 0) throw new Error("删除延时必须大于 0");
            state.delayMs = delayMs;
            publish();
        },
        acceptMessage({ accountId, authorId, channelId, messageId, sentAt }) {
            if (!running || accountId !== getAccountId() || authorId !== accountId) return false;
            const data = account(accountId);
            const channel = data.channels[channelId];
            if (!channel?.enabled || sentAt < channel.activatedAt) return false;
            if (data.tasks.some(t => t.messageId === messageId)) return false;
            data.tasks.push({ channelId, messageId, dueAt: sentAt + state.delayMs, status: "pending" });
            publish();
            arm();
            return true;
        },
        retryFailed() {
            for (const task of account(getAccountId()).tasks) {
                if (task.status === "failed") { task.status = "pending"; task.dueAt = now(); }
            }
            publish();
            arm();
        },
        flush
    };
}

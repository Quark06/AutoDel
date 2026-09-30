import test from "node:test";
import assert from "node:assert/strict";
import { createAutoDel } from "../../src/shared/core.js";

function fixture() {
    let clock = 1000;
    let saved;
    let accountId = "self";
    const deleted = [];
    const options = {
        load: () => saved,
        save: state => { saved = state; },
        getAccountId: () => accountId,
        deleteMessage: async (channelId, messageId) => deleted.push([channelId, messageId]),
        now: () => clock,
        setTimer: () => 1,
        clearTimer: () => {},
        onError: () => {}
    };
    const core = createAutoDel(options);
    core.start();
    core.setDelay(3000);
    return { core, options, deleted, advance: ms => { clock += ms; },
        switchAccount: id => { accountId = id; },
        send: (channelId, messageId, authorId = accountId) => core.acceptMessage({
            accountId, authorId, channelId, messageId, sentAt: clock
        }) };
}

test("聊天独立开关：只接受激活聊天中自己的新消息，到期删除", async () => {
    const f = fixture();
    f.core.toggle("A");
    assert.equal(f.core.getSnapshot("A").enabled, true);
    assert.equal(f.core.getSnapshot("B").enabled, false);
    assert.equal(f.send("A", "1"), true);
    assert.equal(f.send("B", "2"), false);
    assert.equal(f.send("A", "3", "other"), false);
    f.advance(2999);
    await f.core.flush();
    assert.deepEqual(f.deleted, []);
    f.advance(1);
    await f.core.flush();
    assert.deepEqual(f.deleted, [["A", "1"]]);
    assert.equal(f.core.getSnapshot("A").pending, 0);
});

test("关闭后旧任务继续，新任务停止；改延时只影响新消息", async () => {
    const f = fixture();
    f.core.toggle("A");
    f.send("A", "old");
    f.core.setDelay(1000);
    f.send("A", "new");
    f.core.toggle("A");
    assert.equal(f.send("A", "off"), false);
    f.advance(1000);
    await f.core.flush();
    assert.deepEqual(f.deleted, [["A", "new"]]);
    f.advance(2000);
    await f.core.flush();
    assert.deepEqual(f.deleted, [["A", "new"], ["A", "old"]]);
});

test("插件重启恢复任务，切换账号不执行另一账号任务", async () => {
    const f = fixture();
    f.core.toggle("A");
    f.send("A", "persisted");
    f.core.stop();
    f.advance(5000);
    const restored = createAutoDel(f.options);
    f.switchAccount("second");
    restored.start();
    assert.equal(restored.getSnapshot("A").enabled, false);
    await restored.flush();
    assert.deepEqual(f.deleted, []);
    f.switchAccount("self");
    assert.equal(restored.getSnapshot("A").enabled, true);
    await restored.flush();
    assert.deepEqual(f.deleted, [["A", "persisted"]]);
});

test("删除失败保留任务，手动重试后移除", async () => {
    const f = fixture();
    let fail = true;
    const core = createAutoDel({ ...f.options, deleteMessage: async () => {
        if (fail) throw new Error("模拟接口失败");
    } });
    core.start();
    core.toggle("A");
    core.acceptMessage({ accountId: "self", authorId: "self", channelId: "A", messageId: "retry", sentAt: 1000 });
    f.advance(3000);
    await core.flush();
    assert.equal(core.getSnapshot("A").failed, 1);
    fail = false;
    core.retryFailed();
    await core.flush();
    assert.equal(core.getSnapshot("A").failed, 0);
    assert.equal(core.getSnapshot("A").pending, 0);
});

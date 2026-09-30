import { createAutoDel } from "../shared/core.js";
import { createKettuAdapter } from "./adapter.js";
import { createUI } from "./ui.js";

// Kettu evaluates the bundle inside a function whose argument is `vendetta`.
const api = vendetta;
let core;
let ui;
let cleanup = [];
export default {
    onLoad() {
        const adapter = createKettuAdapter(api);
        core = createAutoDel({
            load: () => api.plugin.storage.state,
            save: state => { api.plugin.storage.state = state; },
            getAccountId: adapter.getAccountId,
            deleteMessage: adapter.deleteMessage,
            onError: error => api.logger.error("AutoDel 删除失败", error)
        });
        ui = createUI(adapter, () => core);
        cleanup.push(adapter.listen(core));
        cleanup.push(adapter.mountButton(ui.FloatingButton));
        core.start();
    },
    onUnload() {
        core?.stop();
        cleanup.splice(0).reverse().forEach(dispose => dispose());
    },
    settings() { return ui ? ui.Settings() : null; }
};

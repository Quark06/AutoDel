import { createAutoDel } from "../shared/core.js";
import { createBetterDiscordAdapter } from "./adapter.js";
import { createUI } from "./ui.js";

export default class AutoDel {
    start() {
        this.stop();
        this.api = new BdApi("AutoDel");
        try {
            this.adapter = createBetterDiscordAdapter(this.api);
            this.core = createAutoDel({ ...this.adapter,
                onError: error => this.api.Logger.error("删除失败", error) });
            this.ui = createUI(this.api, this.adapter, this.core);
            this.core.start();
            this.ui.mount();
            this.cleanup = this.adapter.listen(this.core, this.ui.render);
            void this.core.flush();
        } catch (error) {
            this.stop();
            throw error;
        }
    }
    stop() {
        this.core?.stop();
        this.cleanup?.();
        this.cleanup = undefined;
        this.ui?.unmount();
        this.ui = undefined;
        this.core = undefined;
    }
    getSettingsPanel() { return this.ui?.settings(); }
}

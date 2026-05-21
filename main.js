var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => NexusSyncPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");

// src/sync-client.ts
var import_obsidian = require("obsidian");

// src/clock-sync.ts
var clockOffset = 0;
function updateClockOffset(serverTimeHeader) {
  try {
    const serverMs = new Date(serverTimeHeader).getTime();
    const localMs = Date.now();
    if (!isNaN(serverMs)) {
      clockOffset = serverMs - localMs;
    }
  } catch {
  }
}

// src/sync-client.ts
var SyncClient = class {
  baseUrl;
  apiKey;
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
  }
  /** Update connection settings (e.g., when user changes settings). */
  updateSettings(baseUrl, apiKey) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
  }
  /** Check if the client is configured (has URL and key). */
  isConfigured() {
    return this.baseUrl.length > 0 && this.apiKey.length > 0;
  }
  /** Extract and update clock offset from response headers. */
  syncClock(response) {
    const serverTime = response.headers["x-server-time"];
    if (serverTime) {
      updateClockOffset(serverTime);
    }
  }
  /** Common headers for all requests. */
  headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json"
    };
  }
  /**
   * Register a new sync device.
   * POST /api/sync/register
   */
  async register(deviceName, platform) {
    const response = await (0, import_obsidian.requestUrl)({
      url: `${this.baseUrl}/api/sync/register`,
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ device_name: deviceName, platform })
    });
    this.syncClock(response);
    if (response.status !== 200) {
      throw new Error(
        `Registration failed: ${response.status} ${response.text}`
      );
    }
    return response.json;
  }
  /**
   * Get changes since a sequence number.
   * POST /api/sync/changes
   */
  async getChanges(deviceId, sinceSeq, limit = 500) {
    const response = await (0, import_obsidian.requestUrl)({
      url: `${this.baseUrl}/api/sync/changes`,
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        device_id: deviceId,
        since_seq: sinceSeq,
        limit
      })
    });
    this.syncClock(response);
    if (response.status !== 200) {
      throw new Error(
        `Get changes failed: ${response.status} ${response.text}`
      );
    }
    return response.json;
  }
  /**
   * Download a file from the vault.
   * GET /api/sync/pull/:path
   *
   * Returns raw ArrayBuffer content and the content hash.
   */
  async pullFile(path) {
    const response = await (0, import_obsidian.requestUrl)({
      url: `${this.baseUrl}/api/sync/pull/${encodeURIComponent(path)}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`
      }
    });
    this.syncClock(response);
    if (response.status !== 200) {
      throw new Error(
        `Pull file failed: ${response.status} ${response.text}`
      );
    }
    const contentHash = response.headers["x-content-hash"] || "";
    return {
      content: response.arrayBuffer,
      contentHash
    };
  }
  /**
   * Push a file change to the server.
   * POST /api/sync/push
   */
  async pushFile(deviceId, path, content, baseHash, action) {
    let contentB64 = "";
    if (content !== null) {
      const bytes = new Uint8Array(content);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      contentB64 = btoa(binary);
    }
    const response = await (0, import_obsidian.requestUrl)({
      url: `${this.baseUrl}/api/sync/push`,
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        device_id: deviceId,
        path,
        content: contentB64,
        base_hash: baseHash,
        action
      })
    });
    this.syncClock(response);
    if (response.status !== 200) {
      throw new Error(
        `Push file failed: ${response.status} ${response.text}`
      );
    }
    return response.json;
  }
  /**
   * Update this device's folder configuration on the server.
   * PATCH /api/sync/devices/me
   */
  async updateFolderConfig(deviceId, syncFolders, excludeFolders) {
    const response = await (0, import_obsidian.requestUrl)({
      url: `${this.baseUrl}/api/sync/devices/me?device_id=${encodeURIComponent(deviceId)}`,
      method: "PATCH",
      headers: this.headers(),
      body: JSON.stringify({
        sync_folders: syncFolders || null,
        exclude_folders: excludeFolders || null
      })
    });
    this.syncClock(response);
    if (response.status !== 200) {
      throw new Error(
        `Update folder config failed: ${response.status} ${response.text}`
      );
    }
  }
  /**
   * Get sync engine status.
   * GET /api/sync/status
   */
  async getStatus() {
    const response = await (0, import_obsidian.requestUrl)({
      url: `${this.baseUrl}/api/sync/status`,
      method: "GET",
      headers: this.headers()
    });
    this.syncClock(response);
    if (response.status !== 200) {
      throw new Error(
        `Status check failed: ${response.status} ${response.text}`
      );
    }
    return response.json;
  }
  /**
   * Send client file manifest and get reconciliation plan.
   * POST /api/sync/reconcile
   */
  /**
   * List plugins currently in the server registry.
   * GET /api/sync/plugins
   */
  async listRegistryPlugins() {
    const response = await (0, import_obsidian.requestUrl)({
      url: `${this.baseUrl}/api/sync/plugins`,
      method: "GET",
      headers: this.headers()
    });
    this.syncClock(response);
    if (response.status !== 200) {
      throw new Error(
        `List plugins failed: ${response.status} ${response.text}`
      );
    }
    return response.json;
  }
  /**
   * Seed plugins to the server registry.
   * POST /api/sync/plugins/seed
   */
  async seedPlugins(deviceId, plugins) {
    const response = await (0, import_obsidian.requestUrl)({
      url: `${this.baseUrl}/api/sync/plugins/seed`,
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        device_id: deviceId,
        plugins,
        themes: [],
        snippets: []
      })
    });
    this.syncClock(response);
    if (response.status !== 200) {
      throw new Error(
        `Seed plugins failed: ${response.status} ${response.text}`
      );
    }
    return response.json;
  }
  /**
   * Toggle a plugin's enabled state.
   * POST /api/sync/plugins/{plugin_id}/toggle?enabled=true|false
   */
  async togglePlugin(pluginId, enabled) {
    const response = await (0, import_obsidian.requestUrl)({
      url: `${this.baseUrl}/api/sync/plugins/${encodeURIComponent(pluginId)}/toggle?enabled=${enabled}`,
      method: "POST",
      headers: this.headers()
    });
    this.syncClock(response);
    if (response.status !== 200) {
      throw new Error(`Toggle plugin failed: ${response.status}`);
    }
  }
  /**
   * Toggle whether a plugin's settings (data.json) are synced.
   * PATCH /api/sync/plugins/{plugin_id}/sync-settings?sync=true|false
   */
  async setSyncSettings(pluginId, sync) {
    const response = await (0, import_obsidian.requestUrl)({
      url: `${this.baseUrl}/api/sync/plugins/${encodeURIComponent(pluginId)}/sync-settings?sync=${sync}`,
      method: "PATCH",
      headers: this.headers()
    });
    this.syncClock(response);
    if (response.status !== 200) {
      throw new Error(`Set sync-settings failed: ${response.status}`);
    }
  }
  async reconcile(deviceId, manifest) {
    const response = await (0, import_obsidian.requestUrl)({
      url: `${this.baseUrl}/api/sync/reconcile`,
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        device_id: deviceId,
        manifest
      })
    });
    this.syncClock(response);
    if (response.status !== 200) {
      throw new Error(
        `Reconcile failed: ${response.status} ${response.text}`
      );
    }
    return response.json;
  }
};

// src/settings.ts
var import_obsidian2 = require("obsidian");
var NexusSyncSettingTab = class extends import_obsidian2.PluginSettingTab {
  plugin;
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Nexus Sync Settings" });
    containerEl.createEl("h3", { text: "Connection" });
    new import_obsidian2.Setting(containerEl).setName("Nexus URL").setDesc("Full URL to your Nexus server").addText(
      (text) => text.setPlaceholder("https://nexus.example.com").setValue(this.plugin.settings.nexusUrl).onChange(async (value) => {
        this.plugin.settings.nexusUrl = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("API Key").setDesc("Bearer token for authentication").addText((text) => {
      text.inputEl.type = "password";
      text.setPlaceholder("Enter API key").setValue(this.plugin.settings.apiKey).onChange(async (value) => {
        this.plugin.settings.apiKey = value.trim();
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian2.Setting(containerEl).setName("Device Name").setDesc("Human-readable name for this device").addText(
      (text) => text.setPlaceholder("My Laptop").setValue(this.plugin.settings.deviceName).onChange(async (value) => {
        this.plugin.settings.deviceName = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Sync interval").setDesc("How often to check for changes (seconds)").addSlider(
      (slider) => slider.setLimits(10, 300, 10).setValue(this.plugin.settings.syncIntervalSeconds).setDynamicTooltip().onChange(async (value) => {
        this.plugin.settings.syncIntervalSeconds = value;
        await this.plugin.saveSettings();
        this.plugin.restartPullLoop();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Sync Now").setDesc("Trigger an immediate sync").addButton(
      (button) => button.setButtonText("Sync Now").onClick(async () => {
        button.setDisabled(true);
        button.setButtonText("Syncing...");
        try {
          await this.plugin.syncNow();
          button.setButtonText("Done!");
        } catch (e) {
          button.setButtonText("Error");
          console.error("Nexus Sync: manual sync failed", e);
        }
        setTimeout(() => {
          button.setDisabled(false);
          button.setButtonText("Sync Now");
        }, 2e3);
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Test Connection").setDesc("Verify connection to Nexus server").addButton(
      (button) => button.setButtonText("Test").onClick(async () => {
        button.setDisabled(true);
        button.setButtonText("Testing...");
        try {
          const status = await this.plugin.testConnection();
          button.setButtonText(
            `OK (${status.sync_files_count} files)`
          );
        } catch (e) {
          button.setButtonText("Failed");
          console.error("Nexus Sync: connection test failed", e);
        }
        setTimeout(() => {
          button.setDisabled(false);
          button.setButtonText("Test");
        }, 3e3);
      })
    );
    containerEl.createEl("h3", { text: "Plugin Sync" });
    new import_obsidian2.Setting(containerEl).setName("Auto-seed plugins").setDesc(
      "Automatically push installed plugins to the registry during each sync. New plugins you install will sync to all devices."
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.autoSeedPlugins).onChange(async (value) => {
        this.plugin.settings.autoSeedPlugins = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Seed plugins now").setDesc("Push all installed plugins to the registry immediately").addButton(
      (button) => button.setButtonText("Seed Plugins").onClick(async () => {
        button.setDisabled(true);
        button.setButtonText("Seeding...");
        try {
          const count = await this.plugin.seedLocalPlugins();
          button.setButtonText(`Seeded ${count} plugins`);
        } catch (e) {
          button.setButtonText("Error");
          console.error("Nexus Sync: seed plugins failed", e);
        }
        setTimeout(() => {
          button.setDisabled(false);
          button.setButtonText("Seed Plugins");
        }, 3e3);
      })
    );
    const pluginListContainer = containerEl.createDiv({
      cls: "nexus-sync-plugin-list"
    });
    this.renderPluginList(pluginListContainer);
    containerEl.createEl("h3", { text: "Status" });
    const statusEl = containerEl.createEl("div", {
      cls: "nexus-sync-status"
    });
    const deviceId = this.plugin.settings.deviceId;
    const lastSeq = this.plugin.settings.lastSeq;
    if (deviceId) {
      statusEl.createEl("p", {
        text: `Device ID: ${deviceId}`
      });
      statusEl.createEl("p", {
        text: `Last synced sequence: ${lastSeq}`
      });
    } else {
      statusEl.createEl("p", {
        text: "Not registered. Configure connection settings and click Sync Now."
      });
    }
    if (this.plugin.settings.initialSyncComplete) {
      statusEl.createEl("p", {
        text: "Initial sync: Complete"
      });
    } else {
      statusEl.createEl("p", {
        text: "Initial sync: Pending",
        cls: "nexus-sync-warning"
      });
    }
    const advancedDetails = containerEl.createEl("details");
    advancedDetails.createEl("summary", {
      text: "Advanced",
      cls: "nexus-sync-advanced-toggle"
    });
    const advancedContent = advancedDetails.createDiv();
    new import_obsidian2.Setting(advancedContent).setName("Include folders").setDesc("Only sync these folders (comma-separated). Empty = sync entire vault.").addText(
      (text) => text.setPlaceholder("Leave empty for full vault sync").setValue(this.plugin.settings.syncFolders).onChange(async (value) => {
        this.plugin.settings.syncFolders = value.trim();
        await this.plugin.saveSettings();
        await this.plugin.syncFolderConfig();
      })
    );
    new import_obsidian2.Setting(advancedContent).setName("Exclude folders").setDesc("Never sync these folders (comma-separated).").addText(
      (text) => text.setPlaceholder("e.g. _templates,.trash").setValue(this.plugin.settings.excludeFolders).onChange(async (value) => {
        this.plugin.settings.excludeFolders = value.trim();
        await this.plugin.saveSettings();
        await this.plugin.syncFolderConfig();
      })
    );
  }
  /**
   * Fetch the plugin registry from the server and render a collapsible
   * list with per-plugin toggles for enabled and sync-settings.
   */
  async renderPluginList(container) {
    container.empty();
    if (!this.plugin.client.isConfigured()) {
      container.createEl("p", {
        text: "Connect to Nexus to see registered plugins.",
        cls: "nexus-sync-muted"
      });
      return;
    }
    const loadingEl = container.createEl("p", { text: "Loading plugins..." });
    try {
      const registry = await this.plugin.client.listRegistryPlugins();
      loadingEl.remove();
      const allPlugins = registry.plugins || [];
      if (allPlugins.length === 0) {
        container.createEl("p", {
          text: "No plugins in registry. Click 'Seed Plugins' to populate.",
          cls: "nexus-sync-muted"
        });
        return;
      }
      container.createEl("h3", { text: `Registered Plugins (${allPlugins.length})` });
      for (const plugin of allPlugins) {
        const details = container.createEl("details", {
          cls: "nexus-sync-plugin-item"
        });
        const summary = details.createEl("summary");
        summary.createEl("span", {
          text: `${plugin.name || plugin.id}`,
          cls: "nexus-sync-plugin-name"
        });
        summary.createEl("span", {
          text: ` v${plugin.version || "?"}`,
          cls: "nexus-sync-plugin-version"
        });
        const body = details.createDiv({ cls: "nexus-sync-plugin-body" });
        new import_obsidian2.Setting(body).setName("Sync this plugin").setDesc("Include in cross-device sync").addToggle(
          (toggle) => toggle.setValue(plugin.enabled !== false).onChange(async (value) => {
            try {
              await this.plugin.client.togglePlugin(
                plugin.id,
                value
              );
            } catch (e) {
              new import_obsidian2.Notice(`Failed to toggle ${plugin.id}`);
              toggle.setValue(!value);
            }
          })
        );
        new import_obsidian2.Setting(body).setName("Sync settings").setDesc("Also sync this plugin's settings (data.json)").addToggle(
          (toggle) => toggle.setValue(plugin.sync_settings === true).onChange(async (value) => {
            try {
              await this.plugin.client.setSyncSettings(
                plugin.id,
                value
              );
            } catch (e) {
              new import_obsidian2.Notice(
                `Failed to update sync-settings for ${plugin.id}`
              );
              toggle.setValue(!value);
            }
          })
        );
      }
    } catch (e) {
      loadingEl.setText("Failed to load plugins.");
      console.error("Nexus Sync: failed to load plugin registry", e);
    }
  }
};

// src/file-watcher.ts
var import_obsidian3 = require("obsidian");
var FileWatcher = class {
  vault;
  onFlush;
  // Pending changes keyed by path, debounced
  pending = /* @__PURE__ */ new Map();
  debounceTimers = /* @__PURE__ */ new Map();
  // Write suppression: paths being written by pull sync
  expectedWrites = /* @__PURE__ */ new Set();
  expectedWriteTimers = /* @__PURE__ */ new Map();
  // Event references for cleanup
  eventRefs = [];
  // Debounce durations (ms)
  DEBOUNCE_SAVE = 2e3;
  DEBOUNCE_RAPID = 5e3;
  EXPECTED_WRITE_TIMEOUT = 2e3;
  // Track rapid-fire edits per file
  editCounts = /* @__PURE__ */ new Map();
  editCountTimers = /* @__PURE__ */ new Map();
  RAPID_THRESHOLD = 3;
  // >3 edits in window = rapid
  constructor(vault, onFlush) {
    this.vault = vault;
    this.onFlush = onFlush;
  }
  /** Start watching vault events. */
  start() {
    this.eventRefs.push(
      this.vault.on("create", (file) => this.handleCreate(file)),
      this.vault.on("modify", (file) => this.handleModify(file)),
      this.vault.on("delete", (file) => this.handleDelete(file)),
      this.vault.on("rename", (file, oldPath) => this.handleRename(file, oldPath))
    );
  }
  /** Stop watching and flush any pending changes. */
  async stop() {
    for (const ref of this.eventRefs) {
      this.vault.offref(ref);
    }
    this.eventRefs = [];
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    await this.flushAll();
  }
  // -------------------------------------------------------------------
  // Write suppression
  // -------------------------------------------------------------------
  /** Mark a path as an expected write (from pull sync). */
  expectWrite(path) {
    this.expectedWrites.add(path);
    const existing = this.expectedWriteTimers.get(path);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      this.expectedWrites.delete(path);
      this.expectedWriteTimers.delete(path);
    }, this.EXPECTED_WRITE_TIMEOUT);
    this.expectedWriteTimers.set(path, timer);
  }
  /** Check if a path is an expected write and consume it. */
  consumeExpectedWrite(path) {
    if (this.expectedWrites.has(path)) {
      this.expectedWrites.delete(path);
      const timer = this.expectedWriteTimers.get(path);
      if (timer) {
        clearTimeout(timer);
        this.expectedWriteTimers.delete(path);
      }
      return true;
    }
    return false;
  }
  // -------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------
  handleCreate(file) {
    if (!(file instanceof import_obsidian3.TFile)) return;
    if (this.consumeExpectedWrite(file.path)) return;
    this.queueChange({
      path: file.path,
      action: "create",
      timestamp: Date.now()
    });
  }
  handleModify(file) {
    if (!(file instanceof import_obsidian3.TFile)) return;
    if (this.consumeExpectedWrite(file.path)) return;
    this.queueChange({
      path: file.path,
      action: "modify",
      timestamp: Date.now()
    });
  }
  handleDelete(file) {
    if (!(file instanceof import_obsidian3.TFile)) return;
    this.cancelPending(file.path);
    this.queueChange({
      path: file.path,
      action: "delete",
      timestamp: Date.now()
    });
  }
  handleRename(file, oldPath) {
    if (!(file instanceof import_obsidian3.TFile)) return;
    this.cancelPending(oldPath);
    this.queueChange({
      path: oldPath,
      action: "delete",
      timestamp: Date.now()
    });
    this.queueChange({
      path: file.path,
      action: "create",
      oldPath,
      timestamp: Date.now()
    });
  }
  // -------------------------------------------------------------------
  // Debouncing
  // -------------------------------------------------------------------
  queueChange(change) {
    const { path } = change;
    const count = (this.editCounts.get(path) || 0) + 1;
    this.editCounts.set(path, count);
    const existingCountTimer = this.editCountTimers.get(path);
    if (existingCountTimer) clearTimeout(existingCountTimer);
    this.editCountTimers.set(
      path,
      setTimeout(() => {
        this.editCounts.delete(path);
        this.editCountTimers.delete(path);
      }, this.DEBOUNCE_RAPID)
    );
    const isRapid = count > this.RAPID_THRESHOLD;
    const debounceMs = isRapid ? this.DEBOUNCE_RAPID : this.DEBOUNCE_SAVE;
    this.pending.set(path, change);
    const existingTimer = this.debounceTimers.get(path);
    if (existingTimer) clearTimeout(existingTimer);
    this.debounceTimers.set(
      path,
      setTimeout(() => {
        this.debounceTimers.delete(path);
        this.flushPath(path);
      }, debounceMs)
    );
  }
  cancelPending(path) {
    this.pending.delete(path);
    const timer = this.debounceTimers.get(path);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(path);
    }
  }
  async flushPath(path) {
    const change = this.pending.get(path);
    if (!change) return;
    this.pending.delete(path);
    try {
      await this.onFlush([change]);
    } catch (e) {
      console.error(`Nexus Sync: flush failed for ${path}`, e);
    }
  }
  /** Flush all pending changes immediately (used on plugin unload). */
  async flushAll() {
    const changes = Array.from(this.pending.values());
    this.pending.clear();
    if (changes.length === 0) return;
    try {
      await this.onFlush(changes);
    } catch (e) {
      console.error("Nexus Sync: flushAll failed", e);
    }
  }
};

// src/ws-client.ts
var WSClient = class {
  ws = null;
  baseUrl;
  apiKey;
  deviceId;
  onChangeReceived;
  onScramReceived;
  onCommandReceived;
  reconnectAttempts = 0;
  reconnectTimer = null;
  intentionallyClosed = false;
  _connected = false;
  MAX_BACKOFF = 3e4;
  // 30 seconds
  constructor(baseUrl, apiKey, deviceId, onChangeReceived, onScramReceived, onCommandReceived) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
    this.deviceId = deviceId;
    this.onChangeReceived = onChangeReceived;
    this.onScramReceived = onScramReceived;
    this.onCommandReceived = onCommandReceived;
  }
  get connected() {
    return this._connected;
  }
  /** Update connection parameters (e.g., after settings change). */
  updateSettings(baseUrl, apiKey, deviceId) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
    this.deviceId = deviceId;
  }
  /** Connect to the WebSocket endpoint. */
  connect() {
    if (this.ws) {
      this.disconnect();
    }
    this.intentionallyClosed = false;
    const wsUrl = this.baseUrl.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
    const url = `${wsUrl}/api/sync/ws?device_id=${encodeURIComponent(this.deviceId)}&token=${encodeURIComponent(this.apiKey)}`;
    try {
      this.ws = new WebSocket(url);
      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onclose = (event) => this.handleClose(event);
      this.ws.onerror = (event) => this.handleError(event);
    } catch (e) {
      console.error("Nexus Sync WS: connection failed", e);
      this.scheduleReconnect();
    }
  }
  /** Disconnect intentionally (plugin unload). */
  disconnect() {
    this.intentionallyClosed = true;
    this._connected = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close(1e3, "Plugin unloading");
      } catch {
      }
      this.ws = null;
    }
  }
  /** Send an ack message for a processed sequence number. */
  sendAck(seq) {
    if (this.ws && this._connected) {
      try {
        this.ws.send(JSON.stringify({ type: "ack", seq }));
      } catch {
      }
    }
  }
  // -------------------------------------------------------------------
  // Internal handlers
  // -------------------------------------------------------------------
  handleOpen() {
    this._connected = true;
    this.reconnectAttempts = 0;
    console.log("Nexus Sync WS: connected");
  }
  async handleMessage(event) {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    switch (msg.type) {
      case "change":
        try {
          await this.onChangeReceived(msg.seq, msg.path, msg.action);
          this.sendAck(msg.seq);
        } catch (e) {
          console.error("Nexus Sync WS: change handler failed", e);
        }
        break;
      case "scram":
        this.onScramReceived(msg.message);
        break;
      case "command":
        try {
          await this.onCommandReceived(msg.action);
        } catch (e) {
          console.error("Nexus Sync WS: command handler failed", e);
        }
        break;
      case "ping":
        break;
    }
  }
  handleClose(event) {
    this._connected = false;
    this.ws = null;
    if (this.intentionallyClosed) {
      console.log("Nexus Sync WS: disconnected (intentional)");
      return;
    }
    console.log(
      `Nexus Sync WS: disconnected (code=${event.code}, reason=${event.reason})`
    );
    this.scheduleReconnect();
  }
  handleError(_event) {
    console.error("Nexus Sync WS: error");
  }
  scheduleReconnect() {
    if (this.intentionallyClosed) return;
    if (this.reconnectTimer) return;
    const backoff = Math.min(
      1e3 * Math.pow(2, this.reconnectAttempts),
      this.MAX_BACKOFF
    );
    this.reconnectAttempts++;
    console.log(
      `Nexus Sync WS: reconnecting in ${backoff / 1e3}s (attempt ${this.reconnectAttempts})`
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, backoff);
  }
};

// src/types.ts
var DEFAULT_SETTINGS = {
  nexusUrl: "",
  apiKey: "",
  deviceName: "",
  syncIntervalSeconds: 30,
  deviceId: null,
  lastSeq: 0,
  syncFolders: "",
  excludeFolders: "",
  initialSyncComplete: false,
  autoSeedPlugins: false
};

// src/main.ts
var InitialSyncModal = class extends import_obsidian4.Modal {
  resolve;
  constructor(app, resolve) {
    super(app);
    this.resolve = resolve;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Initial Sync Setup" });
    contentEl.createEl("p", {
      text: "This vault already has files. How should Nexus Sync handle the initial synchronization?"
    });
    const mergeDiv = contentEl.createDiv({ cls: "nexus-sync-option" });
    mergeDiv.createEl("h3", { text: "Merge with server" });
    mergeDiv.createEl("p", {
      text: "Compare local files against the server. Files that differ will be merged using three-way merge. Files only on one side will be synced to the other. This is recommended when your local vault is mostly the same as the server."
    });
    const mergeBtn = mergeDiv.createEl("button", {
      text: "Merge",
      cls: "mod-cta"
    });
    mergeBtn.addEventListener("click", () => {
      this.resolve("merge");
      this.close();
    });
    const freshDiv = contentEl.createDiv({ cls: "nexus-sync-option" });
    freshDiv.createEl("h3", { text: "Fresh sync from server" });
    freshDiv.createEl("p", {
      text: "Delete all local vault files and download everything from the server. Use this when starting with a clean slate or when the server is the authoritative source."
    });
    const freshBtn = freshDiv.createEl("button", {
      text: "Replace local vault",
      cls: "mod-warning"
    });
    freshBtn.addEventListener("click", () => {
      this.resolve("fresh");
      this.close();
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};
var NexusSyncPlugin = class extends import_obsidian4.Plugin {
  settings = DEFAULT_SETTINGS;
  client = new SyncClient("", "");
  fileWatcher = null;
  wsClient = null;
  pullTimer = null;
  statusBarEl = null;
  syncing = false;
  pushPaused = false;
  // SCRAM pause
  // Content hash cache: path -> last known hash (for push base_hash)
  hashCache = /* @__PURE__ */ new Map();
  async onload() {
    await this.loadSettings();
    this.client = new SyncClient(
      this.settings.nexusUrl,
      this.settings.apiKey
    );
    this.statusBarEl = this.addStatusBarItem();
    this.setStatus("idle");
    this.addSettingTab(new NexusSyncSettingTab(this.app, this));
    if (this.client.isConfigured() && this.settings.deviceId) {
      setTimeout(() => this.initSync(), 2e3);
    } else {
      this.setStatus("unconfigured");
    }
    this.addCommand({
      id: "sync-now",
      name: "Sync now",
      callback: () => this.syncNow()
    });
  }
  async onunload() {
    if (this.fileWatcher) {
      await this.fileWatcher.stop();
      this.fileWatcher = null;
    }
    if (this.wsClient) {
      this.wsClient.disconnect();
      this.wsClient = null;
    }
    this.stopPullLoop();
  }
  // -----------------------------------------------------------------------
  // Settings
  // -----------------------------------------------------------------------
  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
    if (!this.settings.deviceName) {
      try {
        const os = require("os");
        this.settings.deviceName = os.hostname();
      } catch {
        this.settings.deviceName = `Obsidian-${navigator.platform || "Desktop"}`;
      }
    }
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.client.updateSettings(
      this.settings.nexusUrl,
      this.settings.apiKey
    );
    if (this.wsClient && this.settings.deviceId) {
      this.wsClient.updateSettings(
        this.settings.nexusUrl,
        this.settings.apiKey,
        this.settings.deviceId
      );
    }
  }
  // -----------------------------------------------------------------------
  // Initialization
  // -----------------------------------------------------------------------
  async initSync() {
    try {
      if (this.settings.deviceId) {
        const currentHost = this.getHostname();
        const storedHost = this.settings._registeredHost || "";
        if (storedHost && storedHost !== currentHost) {
          console.log(
            `Nexus Sync: inherited settings detected (registered="${storedHost}", this="${currentHost}") -- resetting for this device`
          );
          this.settings.deviceId = null;
          this.settings.initialSyncComplete = false;
          this.settings.lastSeq = 0;
          this.settings._registeredHost = null;
          this.hashCache.clear();
          await this.saveSettings();
        }
      }
      const isFirstConnect = !this.settings.deviceId;
      if (isFirstConnect) {
        await this.registerDevice();
      }
      if (!this.settings.initialSyncComplete) {
        const hasFiles = this.vaultHasFiles();
        if (hasFiles) {
          const mode = await this.showInitialSyncModal();
          if (mode === "merge") {
            await this.runReconciliation();
          } else {
            await this.runFreshSync();
          }
        } else {
          await this.runReconciliation();
        }
        this.settings.initialSyncComplete = true;
        await this.saveSettings();
      }
      this.startPullLoop();
      this.fileWatcher = new FileWatcher(
        this.app.vault,
        (changes) => this.handleLocalChanges(changes)
      );
      this.fileWatcher.start();
      this.wsClient = new WSClient(
        this.settings.nexusUrl,
        this.settings.apiKey,
        this.settings.deviceId,
        (seq, path, action) => this.handleWSChange(seq, path, action),
        (message) => this.handleWSScram(message),
        (action) => this.handleRemoteCommand(action)
      );
      this.wsClient.connect();
      this.setStatus("synced");
    } catch (e) {
      console.error("Nexus Sync: init failed", e);
      this.setStatus("error");
    }
  }
  getHostname() {
    try {
      return require("os").hostname();
    } catch {
      return navigator.platform || "unknown";
    }
  }
  async registerDevice() {
    const platform = this.detectPlatform();
    const result = await this.client.register(
      this.settings.deviceName,
      platform
    );
    this.settings.deviceId = result.device_id;
    this.settings._registeredHost = this.getHostname();
    this.settings.lastSeq = result.current_seq;
    await this.saveSettings();
    console.log(
      `Nexus Sync: registered as ${result.device_id} (seq: ${result.current_seq})`
    );
  }
  detectPlatform() {
    const P = window.Platform;
    if (P?.isMobileApp) {
      return P.isIosApp ? "ios" : "android";
    }
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("win")) return "desktop-windows";
    if (ua.includes("mac")) return "desktop-mac";
    if (ua.includes("linux")) return "desktop-linux";
    return "desktop-unknown";
  }
  // -----------------------------------------------------------------------
  // Pull sync loop
  // -----------------------------------------------------------------------
  startPullLoop() {
    this.stopPullLoop();
    const intervalMs = this.settings.syncIntervalSeconds * 1e3;
    this.pullTimer = setInterval(() => this.pullChanges(), intervalMs);
    console.log(
      `Nexus Sync: pull loop started (every ${this.settings.syncIntervalSeconds}s)`
    );
  }
  stopPullLoop() {
    if (this.pullTimer !== null) {
      clearInterval(this.pullTimer);
      this.pullTimer = null;
    }
  }
  restartPullLoop() {
    if (this.pullTimer !== null) {
      this.startPullLoop();
    }
  }
  async syncNow() {
    if (!this.client.isConfigured()) {
      new import_obsidian4.Notice("Nexus Sync: configure connection settings first");
      return;
    }
    if (!this.settings.deviceId || !this.settings.initialSyncComplete) {
      await this.initSync();
      return;
    }
    await this.pullChanges();
  }
  async testConnection() {
    return this.client.getStatus();
  }
  /** Push folder config to server after settings change. */
  async syncFolderConfig() {
    if (!this.settings.deviceId || !this.client.isConfigured()) return;
    try {
      await this.client.updateFolderConfig(
        this.settings.deviceId,
        this.settings.syncFolders,
        this.settings.excludeFolders
      );
    } catch (e) {
      console.error("Nexus Sync: failed to update folder config on server", e);
    }
  }
  /**
   * Scan .obsidian/plugins/ and seed all installed plugins to the registry.
   * Each plugin's manifest.json, main.js, and styles.css are base64-encoded
   * and pushed to POST /api/sync/plugins/seed. The server handles dedup.
   */
  async seedLocalPlugins() {
    if (!this.settings.deviceId || !this.client.isConfigured()) {
      new import_obsidian4.Notice("Nexus Sync: not configured");
      return 0;
    }
    const adapter = this.app.vault.adapter;
    const pluginsDir = (0, import_obsidian4.normalizePath)(".obsidian/plugins");
    let listing;
    try {
      listing = await adapter.list(pluginsDir);
    } catch {
      console.warn("Nexus Sync: could not list plugins directory");
      return 0;
    }
    const payloads = [];
    const SEED_FILES = ["manifest.json", "main.js", "styles.css", "data.json"];
    for (const folder of listing.folders) {
      const pluginId = folder.split("/").pop() || "";
      if (!pluginId || pluginId === "nexus-sync") continue;
      const manifestPath = (0, import_obsidian4.normalizePath)(`${folder}/manifest.json`);
      let manifest;
      try {
        const raw = await adapter.read(manifestPath);
        manifest = JSON.parse(raw);
      } catch {
        continue;
      }
      const mainPath = (0, import_obsidian4.normalizePath)(`${folder}/main.js`);
      if (!await adapter.exists(mainPath)) continue;
      const files = {};
      for (const fname of SEED_FILES) {
        const fpath = (0, import_obsidian4.normalizePath)(`${folder}/${fname}`);
        try {
          if (await adapter.exists(fpath)) {
            const content = await adapter.readBinary(fpath);
            files[fname] = this.arrayBufferToBase64(content);
          }
        } catch {
        }
      }
      if (!files["manifest.json"] || !files["main.js"]) continue;
      payloads.push({
        id: manifest.id || pluginId,
        name: manifest.name || pluginId,
        version: manifest.version || "0.0.0",
        description: manifest.description,
        author: manifest.author,
        category: "plugin",
        files
      });
    }
    if (payloads.length === 0) {
      console.log("Nexus Sync: no plugins to seed");
      return 0;
    }
    try {
      const result = await this.client.seedPlugins(
        this.settings.deviceId,
        payloads
      );
      console.log(
        `Nexus Sync: seeded ${result.count} plugins: ${result.seeded.join(", ")}`
      );
      return result.count;
    } catch (e) {
      console.error("Nexus Sync: seed failed", e);
      throw e;
    }
  }
  /** Convert ArrayBuffer to base64 string. */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  // -----------------------------------------------------------------------
  // Pull logic
  // -----------------------------------------------------------------------
  async pullChanges() {
    if (this.syncing) return;
    if (!this.settings.deviceId) return;
    this.syncing = true;
    this.setStatus("syncing");
    try {
      let hasMore = true;
      let totalApplied = 0;
      while (hasMore) {
        const resp = await this.client.getChanges(
          this.settings.deviceId,
          this.settings.lastSeq
        );
        if (resp.commands && Array.isArray(resp.commands)) {
          for (const cmd of resp.commands) {
            await this.handleRemoteCommand(cmd.action);
          }
        }
        for (const change of resp.changes) {
          if (change.device_id === this.settings.deviceId) continue;
          await this.applyChange(change);
          totalApplied++;
        }
        if (resp.changes.length > 0) {
          const lastChange = resp.changes[resp.changes.length - 1];
          this.settings.lastSeq = lastChange.seq;
          await this.saveSettings();
        }
        hasMore = resp.has_more;
      }
      this.setStatus("synced");
      if (totalApplied > 0) {
        console.log(
          `Nexus Sync: pulled ${totalApplied} change(s), seq=${this.settings.lastSeq}`
        );
      }
      if (this.settings.autoSeedPlugins) {
        try {
          await this.seedLocalPlugins();
        } catch (e) {
          console.warn("Nexus Sync: auto-seed plugins failed (non-critical)", e);
        }
      }
    } catch (e) {
      console.error("Nexus Sync: pull failed", e);
      this.setStatus("error");
    } finally {
      this.syncing = false;
    }
  }
  async applyChange(change) {
    const path = (0, import_obsidian4.normalizePath)(change.path);
    if (change.content_hash) {
      this.hashCache.set(path, change.content_hash);
    }
    switch (change.action) {
      case "create":
      case "modify":
        await this.applyCreateOrModify(path);
        break;
      case "delete":
        await this.applyDelete(path);
        break;
      case "rename":
        if (change.old_path) {
          await this.applyDelete((0, import_obsidian4.normalizePath)(change.old_path));
        }
        await this.applyCreateOrModify(path);
        break;
    }
  }
  async applyCreateOrModify(path) {
    try {
      const { content, contentHash } = await this.client.pullFile(path);
      if (contentHash) {
        this.hashCache.set(path, contentHash);
      }
      if (this.fileWatcher) {
        this.fileWatcher.expectWrite(path);
      }
      const dir = path.substring(0, path.lastIndexOf("/"));
      if (dir) {
        await this.ensureFolder(dir);
      }
      const existing = this.app.vault.getAbstractFileByPath(path);
      if (existing instanceof import_obsidian4.TFile) {
        await this.app.vault.modifyBinary(existing, content);
      } else {
        await this.app.vault.createBinary(path, content);
      }
    } catch (e) {
      console.error(`Nexus Sync: failed to apply ${path}`, e);
    }
  }
  async applyDelete(path) {
    try {
      this.hashCache.delete(path);
      const existing = this.app.vault.getAbstractFileByPath(path);
      if (existing instanceof import_obsidian4.TFile) {
        await this.app.vault.delete(existing);
      }
    } catch {
    }
  }
  async ensureFolder(folderPath) {
    const normalized = (0, import_obsidian4.normalizePath)(folderPath);
    const existing = this.app.vault.getAbstractFileByPath(normalized);
    if (existing instanceof import_obsidian4.TFolder) return;
    const parts = normalized.split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      const folder = this.app.vault.getAbstractFileByPath(current);
      if (!folder) {
        try {
          await this.app.vault.createFolder(current);
        } catch {
        }
      }
    }
  }
  // -----------------------------------------------------------------------
  // Push logic (Sprint 7)
  // -----------------------------------------------------------------------
  async handleLocalChanges(changes) {
    if (!this.settings.deviceId) return;
    if (this.pushPaused) return;
    for (const change of changes) {
      if (!this.pathMatchesFilters(change.path)) continue;
      try {
        await this.pushChange(change);
      } catch (e) {
        console.error(`Nexus Sync: push failed for ${change.path}`, e);
      }
    }
  }
  async pushChange(change) {
    const path = change.path;
    const deviceId = this.settings.deviceId;
    if (change.action === "delete") {
      const baseHash2 = this.hashCache.get(path) || "";
      const result2 = await this.client.pushFile(
        deviceId,
        path,
        null,
        baseHash2,
        "delete"
      );
      this.hashCache.delete(path);
      this.handlePushResult(path, result2);
      return;
    }
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof import_obsidian4.TFile)) return;
    const content = await this.app.vault.readBinary(file);
    const baseHash = this.hashCache.get(path) || "";
    const action = change.action === "create" ? "create" : "modify";
    const result = await this.client.pushFile(
      deviceId,
      path,
      content,
      baseHash,
      action
    );
    this.handlePushResult(path, result);
  }
  handlePushResult(path, result) {
    if (!result) return;
    if (result.content_hash) {
      this.hashCache.set(path, result.content_hash);
    }
    if (result.seq && result.seq > this.settings.lastSeq) {
      this.settings.lastSeq = result.seq;
      this.saveSettings();
    }
    const filename = path.split("/").pop() || path;
    switch (result.status) {
      case "merged":
        if (result.merged_content) {
          this.applyMergedContent(path, result.merged_content);
        }
        new import_obsidian4.Notice(`Nexus Sync: Merged -- ${filename}`);
        break;
      case "conflict_markers":
        if (result.merged_content) {
          this.applyMergedContent(path, result.merged_content);
        }
        new import_obsidian4.Notice(
          `Nexus Sync: Conflict in ${filename} -- markers added, please resolve`
        );
        break;
      case "accepted":
        break;
    }
  }
  async applyMergedContent(path, content) {
    if (this.fileWatcher) {
      this.fileWatcher.expectWrite(path);
    }
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof import_obsidian4.TFile) {
      await this.app.vault.modify(file, content);
    }
  }
  // -----------------------------------------------------------------------
  // WebSocket handlers (Sprint 7)
  // -----------------------------------------------------------------------
  async handleWSChange(seq, path, action) {
    const normalizedPath = (0, import_obsidian4.normalizePath)(path);
    if (action === "delete") {
      await this.applyDelete(normalizedPath);
    } else {
      await this.applyCreateOrModify(normalizedPath);
    }
    if (seq > this.settings.lastSeq) {
      this.settings.lastSeq = seq;
      await this.saveSettings();
    }
  }
  handleWSScram(message) {
    this.pushPaused = true;
    new import_obsidian4.Notice(`Nexus Sync: SCRAM -- ${message}`, 0);
    this.setStatus("error");
    console.error(`Nexus Sync: SCRAM received -- ${message}`);
  }
  // -----------------------------------------------------------------------
  // Remote command handling (Sprint 8)
  // -----------------------------------------------------------------------
  async handleRemoteCommand(action) {
    console.log(`Nexus Sync: remote command received -- ${action}`);
    switch (action) {
      case "reset":
        new import_obsidian4.Notice("Nexus Sync: Server requested full re-sync");
        this.settings.lastSeq = 0;
        this.hashCache.clear();
        await this.saveSettings();
        await this.pullChanges();
        break;
      case "freeze":
        this.pushPaused = true;
        new import_obsidian4.Notice("Nexus Sync: Device frozen -- push disabled (read-only)");
        break;
      case "unfreeze":
        this.pushPaused = false;
        new import_obsidian4.Notice("Nexus Sync: Device unfrozen -- push re-enabled");
        break;
      case "wipe":
        new import_obsidian4.Notice("Nexus Sync: Remote wipe -- clearing vault files", 0);
        await this.executeWipe();
        break;
      default:
        console.warn(`Nexus Sync: unknown remote command -- ${action}`);
    }
  }
  async executeWipe() {
    const files = this.app.vault.getFiles();
    let wiped = 0;
    for (const file of files) {
      if (file.path.startsWith(".obsidian/")) continue;
      try {
        await this.app.vault.delete(file);
        wiped++;
      } catch {
      }
    }
    this.settings.deviceId = null;
    this.settings.lastSeq = 0;
    this.hashCache.clear();
    await this.saveSettings();
    if (this.wsClient) {
      this.wsClient.disconnect();
      this.wsClient = null;
    }
    this.stopPullLoop();
    if (this.fileWatcher) {
      await this.fileWatcher.stop();
      this.fileWatcher = null;
    }
    this.setStatus("unconfigured");
    new import_obsidian4.Notice(`Nexus Sync: Wipe complete -- ${wiped} files removed. Re-configure to resume.`, 0);
    console.log(`Nexus Sync: wipe complete -- ${wiped} files removed`);
  }
  // -----------------------------------------------------------------------
  // First-connect reconciliation (Sprint 9)
  // -----------------------------------------------------------------------
  showInitialSyncModal() {
    return new Promise((resolve) => {
      new InitialSyncModal(this.app, resolve).open();
    });
  }
  vaultHasFiles() {
    const files = this.app.vault.getFiles();
    return files.some((f) => !f.path.startsWith(".obsidian/"));
  }
  async runReconciliation() {
    const deviceId = this.settings.deviceId;
    this.setStatus("syncing");
    new import_obsidian4.Notice("Nexus Sync: Scanning local vault...", 0);
    const manifest = await this.buildLocalManifest();
    new import_obsidian4.Notice(`Nexus Sync: ${manifest.length} local files found. Comparing with server...`);
    let plan;
    try {
      plan = await this.client.reconcile(deviceId, manifest);
    } catch (e) {
      if (e?.message?.includes("404") || e?.status === 404) {
        console.log("Nexus Sync: device not found, re-registering...");
        new import_obsidian4.Notice("Nexus Sync: Re-registering device...");
        await this.registerDevice();
        plan = await this.client.reconcile(this.settings.deviceId, manifest);
      } else {
        throw e;
      }
    }
    const { stats, actions } = plan;
    new import_obsidian4.Notice(
      `Nexus Sync: Plan -- ${stats.push} to push, ${stats.pull} to pull, ${stats.identical} identical`
    );
    const pullActions = actions.filter((a) => a.action === "pull");
    let pullCount = 0;
    for (const action of pullActions) {
      try {
        await this.applyCreateOrModify(action.path);
        pullCount++;
        if (pullCount % 10 === 0 || pullCount === pullActions.length) {
          new import_obsidian4.Notice(`Nexus Sync: Pulling... ${pullCount}/${pullActions.length}`, 2e3);
        }
      } catch (e) {
        console.error(`Nexus Sync: reconcile pull failed: ${action.path}`, e);
      }
    }
    const pushActions = actions.filter((a) => a.action === "push");
    let pushCount = 0;
    let mergeCount = 0;
    for (const action of pushActions) {
      try {
        const file = this.app.vault.getAbstractFileByPath(action.path);
        if (!(file instanceof import_obsidian4.TFile)) continue;
        const content = await this.app.vault.readBinary(file);
        const baseHash = "";
        const result = await this.client.pushFile(
          deviceId,
          action.path,
          content,
          baseHash,
          action.reason === "client_only" ? "create" : "modify"
        );
        this.handlePushResult(action.path, result);
        pushCount++;
        if (result.status === "merged" || result.status === "conflict_markers") {
          mergeCount++;
        }
        if (pushCount % 10 === 0 || pushCount === pushActions.length) {
          new import_obsidian4.Notice(`Nexus Sync: Pushing... ${pushCount}/${pushActions.length}`, 2e3);
        }
      } catch (e) {
        console.error(`Nexus Sync: reconcile push failed: ${action.path}`, e);
      }
    }
    new import_obsidian4.Notice(
      `Nexus Sync: Reconciliation complete -- ${pullCount} pulled, ${pushCount} pushed, ${mergeCount} merged`,
      0
    );
  }
  async buildLocalManifest() {
    await this.loadSettings();
    const files = this.app.vault.getFiles().filter(
      (f) => !f.path.startsWith(".obsidian/")
    );
    const filtered = files.filter((f) => this.pathMatchesFilters(f.path));
    const total = filtered.length;
    const manifest = [];
    const filterDesc = this.settings.syncFolders ? `folders: ${this.settings.syncFolders}` : "all folders";
    console.log(`Nexus Sync: scanning ${total} files (${filterDesc})`);
    new import_obsidian4.Notice(`Nexus Sync: Scanning ${total} files (${filterDesc})`);
    let lastNotice = 0;
    for (let i = 0; i < filtered.length; i++) {
      const file = filtered[i];
      const now = Date.now();
      if (i > 0 && (i % 1e3 === 0 || now - lastNotice > 2e3)) {
        const pct = Math.round(i / total * 100);
        new import_obsidian4.Notice(`Nexus Sync: Scanning... ${i}/${total} files (${pct}%)`, 2e3);
        lastNotice = now;
        await new Promise((r) => setTimeout(r, 0));
      }
      try {
        const content = await this.app.vault.readBinary(file);
        const hash = await this.hashContent(content);
        manifest.push({
          path: file.path,
          content_hash: hash,
          size_bytes: content.byteLength
        });
      } catch (e) {
        console.warn(`Nexus Sync: could not hash ${file.path}`, e);
      }
    }
    return manifest;
  }
  async hashContent(content) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", content);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  async runFreshSync() {
    this.setStatus("syncing");
    new import_obsidian4.Notice("Nexus Sync: Clearing local vault for fresh sync...");
    const files = this.app.vault.getFiles();
    for (const file of files) {
      if (file.path.startsWith(".obsidian/")) continue;
      try {
        await this.app.vault.delete(file);
      } catch {
      }
    }
    this.settings.lastSeq = 0;
    this.hashCache.clear();
    await this.saveSettings();
    await this.runReconciliation();
    new import_obsidian4.Notice("Nexus Sync: Fresh sync complete");
  }
  /** Check if a path passes the local folder filters. */
  pathMatchesFilters(path) {
    const { syncFolders, excludeFolders } = this.settings;
    const filename = path.split("/").pop() || path;
    if (filename.includes(".sync-conflict-")) return false;
    if (filename.startsWith(".")) return false;
    if (path.includes("/.trash/")) return false;
    if (excludeFolders) {
      for (const folder of excludeFolders.split(",")) {
        const f = folder.trim().replace(/\/+$/, "") + "/";
        if (path.startsWith(f)) return false;
      }
    }
    if (syncFolders) {
      let matched = false;
      for (const folder of syncFolders.split(",")) {
        const f = folder.trim().replace(/\/+$/, "") + "/";
        if (path.startsWith(f)) {
          matched = true;
          break;
        }
      }
      if (!matched) return false;
    }
    return true;
  }
  // -----------------------------------------------------------------------
  // Status bar
  // -----------------------------------------------------------------------
  setStatus(state) {
    if (!this.statusBarEl) return;
    const wsIndicator = this.wsClient?.connected ? " [WS]" : "";
    const labels = {
      idle: "Nexus: Idle",
      synced: `Nexus: Synced${wsIndicator}`,
      syncing: "Nexus: Syncing...",
      error: "Nexus: Error",
      unconfigured: "Nexus: Not configured"
    };
    this.statusBarEl.setText(labels[state] || "Nexus: Unknown");
  }
};

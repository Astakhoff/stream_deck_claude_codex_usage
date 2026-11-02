"use strict";
const WebSocket = require("ws");
const fs = require("node:fs");
const path = require("node:path");
const { fetchUsage: fetchClaude } = require("./desktop");
const { fetchUsage: fetchCodex } = require("./codex");
const { createPoller } = require("./poller");
const { render, settings } = require("./render");
const { renderResets } = require("./resets");
const args = process.argv.slice(2),
  arg = (name) => args[args.indexOf(name) + 1];
const port = arg("-port");
if (!/^\d+$/.test(port)) process.exit(1);
const socket = new WebSocket(`ws://127.0.0.1:${port}`);
const actions = new Map();
const providers = {
  claude: createPoller(fetchClaude),
  codex: createPoller(fetchCodex),
};
const statusFile = path.join(__dirname, "../status.json");
function send(event, context, payload) {
  if (socket.readyState === WebSocket.OPEN)
    socket.send(JSON.stringify({ event, context, payload }));
}
function paint(context, config) {
  const state = providers[config.provider].state,
    data = state.data;
  const resets = config.actionType === "resets";
  const error = state.error || (resets ? data?.resetError : data?.weeklyError);
  const display =
    resets && data
      ? { ...data, fetchedAt: data.resetFetchedAt ?? data.fetchedAt }
      : data;
  const svg = resets
    ? renderResets(display, config, error)
    : render(data, config, error);
  const image =
    "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
  send("setImage", context, { image, target: 0 });
  send("setTitle", context, { title: "", target: 0 });
  send("sendToPropertyInspector", context, {
    data: display,
    error: error || null,
    nextFetch: state.nextFetch,
    image,
  });
}
function paintAll(provider) {
  for (const [context, config] of actions)
    if (!provider || config.provider === provider) paint(context, config);
}
function saveStatus() {
  try {
    const status = {};
    for (const [provider, { state }] of Object.entries(providers)) {
      status[provider] = {
        data: state.data,
        error: state.error || null,
        nextFetch: state.nextFetch,
      };
    }
    fs.writeFileSync(
      statusFile,
      JSON.stringify({ providers: status, updatedAt: Date.now() }),
      { mode: 0o600 },
    );
  } catch {}
}
async function tick(provider) {
  if (![...actions.values()].some((config) => config.provider === provider))
    return;
  if (await providers[provider].poll()) {
    saveStatus();
    paintAll(provider);
  }
}
socket.on("open", () =>
  socket.send(
    JSON.stringify({ event: arg("-registerEvent"), uuid: arg("-pluginUUID") }),
  ),
);
socket.on("message", (bytes) => {
  let m;
  try {
    m = JSON.parse(bytes);
  } catch {
    return;
  }
  if (m.event === "willAppear" || m.event === "didReceiveSettings") {
    actions.set(m.context, {
      ...settings(m.payload?.settings),
      provider: m.action?.includes(".codex-") ? "codex" : "claude",
      actionType: m.action?.endsWith("resets") ? "resets" : "weekly",
    });
    paint(m.context, actions.get(m.context));
    void tick(actions.get(m.context).provider);
  }
  if (m.event === "willDisappear") actions.delete(m.context);
  if (m.event === "propertyInspectorDidAppear" && actions.has(m.context))
    paint(m.context, actions.get(m.context));
  if (
    m.event === "keyDown" ||
    (m.event === "sendToPlugin" && m.payload?.command === "refresh")
  ) {
    const action = actions.get(m.context);
    if (action) void tick(action.provider);
  }
});
socket.on("close", () => process.exit(0));
socket.on("error", () => process.exit(1));
setInterval(() => {
  for (const provider of Object.keys(providers)) void tick(provider);
}, 1000);
setInterval(() => paintAll(), 60000);

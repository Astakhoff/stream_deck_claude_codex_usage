"use strict";
const WebSocket = require("ws");
const fs = require("node:fs");
const path = require("node:path");
const { fetchUsage } = require("./desktop");
const { render, settings } = require("./render");
const { renderResets } = require("./resets");
const args = process.argv.slice(2),
  arg = (name) => args[args.indexOf(name) + 1];
const port = arg("-port");
if (!/^\d+$/.test(port)) process.exit(1);
const socket = new WebSocket(`ws://127.0.0.1:${port}`);
const actions = new Map();
let data,
  error,
  inFlight = false,
  nextFetch = 0;
const statusFile = path.join(__dirname, "../status.json");
function send(event, context, payload) {
  if (socket.readyState === WebSocket.OPEN)
    socket.send(JSON.stringify({ event, context, payload }));
}
function paint(context, config) {
  const svg =
    config.actionType === "resets"
      ? renderResets(data, config, error)
      : render(
          data?.weeklyError ? null : data,
          config,
          error || data?.weeklyError,
        );
  send("setImage", context, {
    image: "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64"),
    target: 0,
  });
  send("setTitle", context, { title: "", target: 0 });
  send("sendToPropertyInspector", context, {
    data,
    error: error || null,
    nextFetch,
    image: "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64"),
  });
}
function paintAll() {
  for (const [context, config] of actions) paint(context, config);
}
async function tick() {
  if (!actions.size) return;
  if (inFlight || Date.now() < nextFetch) return;
  inFlight = true;
  try {
    data = await fetchUsage();
    error = undefined;
    nextFetch = Date.now() + 60000;
  } catch (e) {
    error = e.code || "ERROR";
    nextFetch = Date.now() + (e.retryMs || 60000);
  } finally {
    inFlight = false;
    // Contains only usage data, never credentials. Useful for local diagnostics.
    try {
      fs.writeFileSync(
        statusFile,
        JSON.stringify({
          data,
          error: error || null,
          nextFetch,
          updatedAt: Date.now(),
        }),
        { mode: 0o600 },
      );
    } catch {}
    paintAll();
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
      actionType: m.action?.endsWith(".resets") ? "resets" : "weekly",
    });
    paint(m.context, actions.get(m.context));
    void tick();
  }
  if (m.event === "willDisappear") actions.delete(m.context);
  if (m.event === "propertyInspectorDidAppear" && actions.has(m.context))
    paint(m.context, actions.get(m.context));
  if (m.event === "keyDown") void tick();
  if (m.event === "sendToPlugin" && m.payload?.command === "refresh")
    void tick();
});
socket.on("close", () => process.exit(0));
socket.on("error", () => process.exit(1));
setInterval(() => void tick(), 1000);
setInterval(paintAll, 60000);

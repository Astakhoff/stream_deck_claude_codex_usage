const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const { EventEmitter } = require("node:events");
test("Stream Deck routes all six actions to the correct provider and shares reads", async () => {
  const sent = [],
    sockets = [],
    counts = { claude: 0, codex: 0 },
    timers = [];
  class Socket extends EventEmitter {
    static OPEN = 1;
    readyState = 1;
    constructor() {
      super();
      sockets.push(this);
    }
    send(message) {
      sent.push(JSON.parse(message));
    }
  }
  const makeData = (remaining) => ({
    remaining,
    resetsAt: "2099-12-01T00:00Z",
    fetchedAt: Date.now(),
    resetFetchedAt: Date.now(),
    resetCredits: {
      known: true,
      grants: remaining === 75 ? [{ count: 2, expiresAt: null }] : [],
    },
  });
  const code = fs.readFileSync(
    path.join(__dirname, "../bin/plugin.js"),
    "utf8",
  );
  const req = (name) =>
    name === "ws"
      ? Socket
      : name === "node:fs"
        ? { writeFileSync() {} }
        : name === "./desktop"
          ? {
              fetchUsage: async () => {
                counts.claude++;
                return makeData(61);
              },
            }
          : name === "./codex"
            ? {
                fetchUsage: async () => {
                  counts.codex++;
                  return makeData(75);
                },
              }
            : name.startsWith("./")
              ? require("../bin/" + name.slice(2))
              : require(name);
  vm.runInNewContext(code, {
    require: req,
    process: {
      argv: [
        "node",
        "plugin",
        "-port",
        "1234",
        "-registerEvent",
        "registerPlugin",
        "-pluginUUID",
        "test-plugin",
      ],
      exit() {},
    },
    __dirname: path.join(__dirname, "../bin"),
    Buffer,
    setInterval: (fn) => timers.push(fn),
  });
  const socket = sockets[0];
  socket.emit("open");
  assert.equal(sent[0].event, "registerPlugin");
  for (const [context, suffix] of [
    ["cl-week", "weekly"],
    ["cl-reset", "resets"],
    ["cx-week", "codex-weekly"],
    ["cx-reset", "codex-resets"],
    ["cl-time", "claude-countdown"],
    ["cx-time", "codex-countdown"],
  ])
    socket.emit(
      "message",
      Buffer.from(
        JSON.stringify({
          event: "willAppear",
          action: "com.local.claude-desktop-week." + suffix,
          context,
          payload: { settings: { provider: "wrong" } },
        }),
      ),
    );
  await new Promise(setImmediate);
  assert.deepEqual(counts, { claude: 1, codex: 1 });
  const svg = (context) =>
    Buffer.from(
      sent
        .filter((m) => m.event === "setImage" && m.context === context)
        .at(-1)
        .payload.image.split(",")[1],
      "base64",
    ).toString();
  assert.match(svg("cl-week"), />61%</);
  assert.match(svg("cx-week"), />75%</);
  assert.match(svg("cl-reset"), />none</);
  assert.match(svg("cx-reset"), />R2</);
  assert.match(svg("cl-time"), />Claude</);
  assert.match(svg("cx-time"), />Codex</);
  assert.doesNotMatch(svg("cl-time") + svg("cx-time"), /%/);
  socket.emit(
    "message",
    Buffer.from(JSON.stringify({ event: "keyDown", context: "cx-week" })),
  );
  await new Promise(setImmediate);
  assert.deepEqual(counts, { claude: 1, codex: 1 });
});

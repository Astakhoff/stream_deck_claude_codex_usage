const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createPoller } = require("../bin/poller");
const good = (key = "account-a") => ({
  accountKey: key,
  remaining: 75,
  resetsAt: "2026-12-01T00:00Z",
  fetchedAt: 1000,
  resetFetchedAt: 1000,
  resetCredits: { known: true, grants: [{ count: 1, expiresAt: null }] },
});
test("one request shared across repeated refreshes and in-flight work", async () => {
  let t = 1000,
    calls = 0,
    resolve;
  const p = createPoller(
    () => {
      calls++;
      return new Promise((r) => (resolve = r));
    },
    () => t,
  );
  const pending = p.poll();
  assert.equal(await p.poll(), false);
  assert.equal(calls, 1);
  resolve(good());
  await pending;
  assert.equal(await p.poll(), false);
  t += 60000;
  const again = p.poll();
  resolve(good());
  await again;
  assert.equal(calls, 2);
});
test("provider failures and cooldowns are independent", async () => {
  let t = 0;
  const claude = createPoller(
    async () => {
      throw { code: "RATE_LIMIT", retryMs: 300000 };
    },
    () => t,
  );
  const codex = createPoller(
    async () => good(),
    () => t,
  );
  await Promise.all([claude.poll(), codex.poll()]);
  assert.equal(codex.state.data.remaining, 75);
  assert.equal(claude.state.nextFetch, 300000);
  assert.equal(codex.state.nextFetch, 60000);
});
test("partial failure preserves prior reading timestamp and marks error", async () => {
  let t = 0,
    n = 0;
  const p = createPoller(
    async () =>
      n++
        ? {
            accountKey: "account-a",
            remaining: 70,
            resetsAt: "2026-12-01",
            fetchedAt: 61000,
            resetError: "OFFLINE",
          }
        : good(),
    () => t,
  );
  await p.poll();
  t = 60000;
  await p.poll();
  assert.equal(p.state.data.remaining, 70);
  assert.equal(p.state.data.resetCredits.grants[0].count, 1);
  assert.equal(p.state.data.resetFetchedAt, 1000);
  assert.equal(p.state.data.resetError, "OFFLINE");
  assert.equal(p.state.data.accountKey, undefined);
});
test("account change and invalid login cannot expose previous account readings", async () => {
  let t = 0,
    n = 0;
  const p = createPoller(
    async () =>
      n++
        ? {
            accountKey: "account-b",
            weeklyError: "OFFLINE",
            resetError: "OFFLINE",
          }
        : good(),
    () => t,
  );
  await p.poll();
  t = 60000;
  await p.poll();
  assert.equal(p.state.data.remaining, undefined);
  assert.equal(p.state.data.resetCredits, undefined);
});
test("authentication failure clears retained readings", async () => {
  let t = 0,
    n = 0;
  const p = createPoller(
    async () => {
      if (n++) throw { code: "OPEN_CODEX" };
      return good();
    },
    () => t,
  );
  await p.poll();
  t = 60000;
  await p.poll();
  assert.equal(p.state.data, undefined);
  assert.equal(p.state.error, "OPEN_CODEX");
});

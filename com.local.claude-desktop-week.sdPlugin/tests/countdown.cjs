const { test } = require("node:test"),
  assert = require("node:assert/strict");
const {
  remainingTime,
  resetClock,
  renderCountdown,
} = require("../bin/countdown");
const now = Date.parse("2026-11-02T05:00Z");
const reset = "2026-11-06T15:00Z";
test("countdown uses full days and remainder hours without rounding up", () =>
  assert.deepEqual(remainingTime(reset, now), {
    days: 4,
    hours: 10,
    underOneHour: false,
  }));
test("hour and day boundaries, including last partial hour", () => {
  assert.deepEqual(remainingTime(new Date(now + 86400000).toISOString(), now), {
    days: 1,
    hours: 0,
    underOneHour: false,
  });
  assert.deepEqual(remainingTime(new Date(now + 3599999).toISOString(), now), {
    days: 0,
    hours: 0,
    underOneHour: true,
  });
  assert.equal(
    remainingTime(new Date(now + 3600000).toISOString(), now).hours,
    1,
  );
});
test("invalid or elapsed deadlines never display a fabricated countdown", () => {
  for (const value of [
    undefined,
    "bad",
    new Date(now).toISOString(),
    new Date(now - 1).toISOString(),
  ])
    assert.equal(remainingTime(value, now), null);
});
test("large time, Week header and provider footer with no percentage", () => {
  for (const provider of ["claude", "codex"]) {
    const svg = renderCountdown(
      { resetsAt: reset, fetchedAt: now },
      { provider },
      null,
      now,
    );
    assert.match(svg, />Week</);
    assert.match(svg, />4d</);
    assert.match(svg, />10h</);
    assert.match(
      svg,
      new RegExp(">" + (provider === "claude" ? "Claude" : "Codex") + "<"),
    );
    assert.doesNotMatch(svg, /%/);
  }
});
test("countdown does not depend on capacity, so zero budget still has its reset time", () =>
  assert.match(
    renderCountdown(
      { remaining: 0, resetsAt: reset, fetchedAt: now },
      {},
      null,
      now,
    ),
    />4d</,
  ));
test("last hour, stale data and errors remain truthful", () => {
  assert.match(
    renderCountdown(
      { resetsAt: new Date(now + 1000).toISOString(), fetchedAt: now },
      {},
      null,
      now,
    ),
    />&lt;1h</,
  );
  assert.match(
    renderCountdown({ resetsAt: reset, fetchedAt: now }, {}, "OFFLINE", now),
    /Week · stale/,
  );
  assert.match(
    renderCountdown(
      { resetsAt: reset, fetchedAt: now - 150001 },
      {},
      null,
      now,
    ),
    /Week · stale/,
  );
  assert.match(
    renderCountdown(null, { provider: "codex" }, "OPEN_CODEX", now),
    />Open Codex</,
  );
  assert.match(
    renderCountdown(
      { resetsAt: new Date(now - 1).toISOString(), fetchedAt: now },
      {},
      null,
      now,
    ),
    />Refreshing</,
  );
});

test("reset clock is English, 24-hour and converted to the requested timezone", () => {
  assert.equal(resetClock(reset, "UTC"), "Fri 15:00");
  assert.equal(resetClock(reset, "Asia/Dubai"), "Fri 19:00");
  assert.equal(resetClock("invalid", "UTC"), "");
});
test("dedicated countdown includes a reset clock, but percentage key only has relative time", () => {
  const { render, countdown } = require("../bin/render");
  const data = { remaining: 37, resetsAt: reset, fetchedAt: now };
  assert.match(renderCountdown(data, {}, null, now), /Fri \d{2}:\d{2}/);
  const svg = render(data, {}, null, now);
  assert.match(svg, />4d 10h</);
  assert.doesNotMatch(svg, /\d{2}:\d{2}/);
  assert.equal(countdown(reset, now + 3600000).main, "4d 9h");
  assert.equal(
    countdown(new Date(now + 3599999).toISOString(), now).main,
    "0d <1h",
  );
  assert.match(
    render(
      { ...data, resetsAt: new Date(now + 1000).toISOString() },
      {},
      null,
      now,
    ),
    /0d &lt;1h/,
  );
});

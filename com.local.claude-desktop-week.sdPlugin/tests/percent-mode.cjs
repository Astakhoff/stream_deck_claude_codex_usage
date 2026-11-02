const { test } = require("node:test"),
  assert = require("node:assert/strict");
const { render, settings } = require("../bin/render");
const now = Date.parse("2026-11-02T05:00Z"),
  data = (remaining) => ({
    remaining,
    resetsAt: "2026-11-06T17:00Z",
    fetchedAt: now,
  });
function fill(svg) {
  const bar = svg.match(
    /<rect x="21" y="87" width="([^"]+)" height="9" rx="4.5" fill="(?!#303c51)[^"]+"\/>/,
  );
  return bar ? Number(bar[1]) : 0;
}
test("existing and invalid settings retain Remaining mode", () => {
  assert.equal(settings().percentMode, "remaining");
  for (const value of [undefined, "other", "USED", "<script>"])
    assert.equal(settings({ percentMode: value }).percentMode, "remaining");
  assert.equal(settings({ percentMode: "used" }).percentMode, "used");
});
test("Remaining shows 37 percent with a 37 percent bar; Used shows its complement", () => {
  const left = render(data(37), {}, null, now),
    used = render(data(37), { percentMode: "used" }, null, now);
  assert.match(left, />37%</);
  assert.match(used, />63%</);
  assert.ok(Math.abs(fill(left) - 102 * 0.37) < 1e-9);
  assert.ok(Math.abs(fill(used) - 102 * 0.63) < 1e-9);
});
test("zero and full boundaries invert both number and fill exactly", () => {
  for (const [remaining, mode, value] of [
    [0, "remaining", 0],
    [0, "used", 100],
    [100, "remaining", 100],
    [100, "used", 0],
  ]) {
    const svg = render(data(remaining), { percentMode: mode }, null, now);
    assert.match(svg, new RegExp(">" + value + "%<"));
    assert.equal(fill(svg), (102 * value) / 100);
  }
});
test("bar has no artificial minimum and follows fractional usage", () => {
  assert.equal(fill(render(data(1), {}, null, now)), 1.02);
  assert.ok(
    Math.abs(
      fill(render(data(37.25), { percentMode: "used" }, null, now)) -
        102 * 0.6275,
    ) < 1e-9,
  );
});
test("warning colors remain tied to remaining capacity in both modes", () => {
  for (const [remaining, color] of [
    [75, "#55e58c"],
    [40, "#ffd45c"],
    [15, "#ff6b70"],
    [5, "#ff344f"],
  ])
    for (const percentMode of ["used", "remaining"])
      assert.match(
        render(data(remaining), { percentMode }, null, now),
        new RegExp('fill="' + color + '"'),
      );
});
test("missing and expired readings never display fabricated Used capacity", () => {
  assert.doesNotMatch(
    render(null, { percentMode: "used" }, null, now),
    />100%</,
  );
  assert.doesNotMatch(
    render(data(37), { percentMode: "used" }, null, Date.parse("2026-11-07")),
    />63%</,
  );
  assert.doesNotMatch(
    render(data(37), { percentMode: "used" }, "OFFLINE", now),
    /STALE/i,
  );
});

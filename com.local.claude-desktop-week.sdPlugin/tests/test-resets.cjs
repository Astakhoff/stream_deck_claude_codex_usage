const { test } = require("node:test"),
  assert = require("node:assert/strict");
const { parseResets, availableResets, renderResets } = require("../bin/resets");
const now = Date.parse("2026-11-02T09:00Z");
const grant = (n, date = "2026-12-02T12:00Z", extra = {}) => ({
  id: "a",
  resets_left: n,
  starts_at: "2026-10-01T00:00Z",
  ends_at: date,
  paused: false,
  usable_now: true,
  ...extra,
});
const parse = (grants) => parseResets({ eligible: true, grants }, now);
test("count sums remaining resets rather than grants, nearest expiry", () => {
  const r = availableResets(
    parse([grant(2), grant(1, "2026-11-20T12:00Z", { id: "b" })]),
    now,
  );
  assert.equal(r.count, 3);
  assert.equal(r.expiresAt, "2026-11-20T12:00:00.000Z");
});
test("no_grant is none, missing data or unsupported surface remains unknown", () => {
  assert.equal(
    availableResets(
      parseResets(
        { eligible: false, ineligible_reason: "no_grant", grants: [] },
        now,
      ),
      now,
    ).count,
    0,
  );
  for (const x of [
    null,
    {},
    { eligible: false, ineligible_reason: "surface", grants: [] },
  ])
    assert.equal(parseResets(x, now).known, false);
});
test("expired, paused, future, exhausted grants excluded", () =>
  assert.equal(
    availableResets(
      parse([
        grant(1, "2026-11-01"),
        grant(1, undefined, { paused: true }),
        grant(1, undefined, { starts_at: "2026-12-01" }),
        grant(0),
      ]),
      now,
    ).count,
    0,
  ));
test("cannot spend until limit reached still counts saved credit", () =>
  assert.equal(
    availableResets(
      parse([
        grant(2, undefined, { usable_now: false, use_requires_limit: true }),
      ]),
      now,
    ).count,
    2,
  ));
test("duplicates do not inflate inventory", () =>
  assert.equal(availableResets(parse([grant(2), grant(2)]), now).count, 2));
test("malformed inventory not silently shown as none", () => {
  for (const g of [grant(-1), grant(1, "nonsense"), { id: "a" }, grant("1")])
    assert.equal(parse([g]).known, false);
});
test("expired credit removed at rendering time", () => {
  const credits = parse([grant(1, "2026-11-03T00:00Z")]);
  assert.equal(availableResets(credits, Date.parse("2026-11-04")).count, 0);
});
test("R1 date, none, unknown and stale display", () => {
  const d = { resetCredits: parse([grant(1)]), fetchedAt: now };
  assert.match(renderResets(d, {}, null, now), />R1</);
  assert.match(renderResets(d, {}, null, now), />DEC 2</);
  assert.match(
    renderResets({ resetCredits: parse([]), fetchedAt: now }, {}, null, now),
    />none</,
  );
  assert.doesNotMatch(renderResets(null, {}, null, now), />none</);
  assert.match(renderResets(d, {}, "OFFLINE", now), />STALE</);
});
test("reset-compatible desktop token preferred over weekly-only profile", () => {
  const { selectCredential } = require("../bin/desktop");
  const key =
    "acct:a|9d1c250a-e61b-44d9-88ed-5944d1962f5e:org:https://api.anthropic.com:";
  assert.equal(
    selectCredential(
      {
        ["acct:a|other:org:https://api.anthropic.com:user:profile"]: {
          token: "wrong-surface",
          expiresAt: now + 60000,
        },
        [key + "user:profile user:inference"]: {
          token: "correct",
          expiresAt: now + 60000,
        },
      },
      "a",
      now,
    ),
    "correct",
  );
});

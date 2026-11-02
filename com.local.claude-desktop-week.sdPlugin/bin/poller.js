"use strict";
function createPoller(fetchUsage, now = Date.now) {
  let accountKey;
  const state = {
    data: undefined,
    error: undefined,
    inFlight: false,
    nextFetch: 0,
  };
  async function poll() {
    if (state.inFlight || now() < state.nextFetch) return false;
    state.inFlight = true;
    try {
      const {
        accountKey: incomingKey,
        retryMs,
        ...incoming
      } = await fetchUsage();
      if (incomingKey && accountKey !== incomingKey) state.data = undefined;
      accountKey = incomingKey;
      const previous = state.data;
      if (
        incoming.weeklyError &&
        incoming.weeklyError !== "OPEN_CODEX" &&
        previous
      ) {
        for (const key of ["remaining", "resetsAt", "fetchedAt"])
          incoming[key] = previous[key];
      }
      if (
        incoming.resetError &&
        incoming.resetError !== "OPEN_CODEX" &&
        previous
      ) {
        incoming.resetCredits = previous.resetCredits;
        incoming.resetFetchedAt = previous.resetFetchedAt ?? previous.fetchedAt;
      }
      state.data = incoming;
      state.error = undefined;
      state.nextFetch = now() + Math.max(60000, retryMs || 60000);
    } catch (error) {
      state.error = error.code || "ERROR";
      if (["OPEN_CODEX", "OPEN_CLAUDE", "MULTIPLE_ORGS"].includes(state.error))
        state.data = undefined;
      state.nextFetch = now() + Math.max(60000, error.retryMs || 60000);
    } finally {
      state.inFlight = false;
    }
    return true;
  }
  return { state, poll };
}
module.exports = { createPoller };

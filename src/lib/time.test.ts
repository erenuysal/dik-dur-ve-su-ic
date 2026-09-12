import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clampToWindow,
  isInsideWindow,
  nextReminderAt,
  nextWindowStart,
  nudgeAt,
} from "./time";

function at(isoLocalLike: string): Date {
  return new Date(isoLocalLike);
}

describe("window", () => {
  it("is closed at 21:00 and open at 11:00", () => {
    assert.equal(isInsideWindow(at("2026-09-12T10:59:00")), false);
    assert.equal(isInsideWindow(at("2026-09-12T11:00:00")), true);
    assert.equal(isInsideWindow(at("2026-09-12T20:59:00")), true);
    assert.equal(isInsideWindow(at("2026-09-12T21:00:00")), false);
  });

  it("jumps outside hours to the next 11:00", () => {
    const morning = nextWindowStart(at("2026-09-12T08:15:00"));
    assert.equal(morning.toISOString(), at("2026-09-12T11:00:00").toISOString());

    const night = nextWindowStart(at("2026-09-12T21:05:00"));
    assert.equal(night.toISOString(), at("2026-09-13T11:00:00").toISOString());
  });

  it("clamps a late candidate to tomorrow 11:00", () => {
    const clamped = clampToWindow(at("2026-09-12T22:10:00"));
    assert.equal(clamped.toISOString(), at("2026-09-13T11:00:00").toISOString());
  });
});

describe("scheduling", () => {
  it("uses the interval only inside the window", () => {
    const next = nextReminderAt(at("2026-09-12T14:00:00"), 60);
    assert.equal(next.toISOString(), at("2026-09-12T15:00:00").toISOString());
  });

  it("does not schedule the next regular reminder after 21:00", () => {
    const next = nextReminderAt(at("2026-09-12T20:30:00"), 60);
    assert.equal(next.toISOString(), at("2026-09-13T11:00:00").toISOString());
  });

  it("nudges after 3 hours, still inside the window", () => {
    const nudge = nudgeAt(at("2026-09-12T12:00:00"));
    assert.equal(nudge.toISOString(), at("2026-09-12T15:00:00").toISOString());
  });

  it("moves a late nudge to the next morning instead of night", () => {
    const nudge = nudgeAt(at("2026-09-12T19:00:00"));
    assert.equal(nudge.toISOString(), at("2026-09-13T11:00:00").toISOString());
  });
});

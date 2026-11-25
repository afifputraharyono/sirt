import { describe, expect, it } from "vitest";
import { toISODate, todayISO } from "./date";

describe("toISODate", () => {
  it("memakai komponen tanggal lokal", () => {
    expect(toISODate(new Date(2026, 10, 25, 0, 30))).toBe("2026-11-25");
  });

  it("mem-pad bulan dan tanggal", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("todayISO", () => {
  it("sama dengan tanggal lokal saat ini", () => {
    expect(todayISO()).toBe(toISODate(new Date()));
  });
});

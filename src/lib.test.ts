import { describe, expect, it } from "vitest";
import { contains, dateLabel, duration, money, tokenExpiry } from "./lib";
describe("display and search rules", () => {
  it("preserves cents when displaying payments and plan prices", () => {
    expect(money(1234.56)).toContain("1.234,56");
    expect(money(0.01)).toContain("0,01");
  });
  it("searches names independently of case and accents", () => {
    expect(contains("perez", "Ana Pérez")).toBe(true);
    expect(contains("ANA", "Ana Pérez")).toBe(true);
    expect(contains("juan", "Ana")).toBe(false);
  });
  it("formats calendar dates without shifting them across time zones", () => {
    expect(dateLabel("2026-10-30")).toContain("30");
    expect(dateLabel("invalid")).toBe("—");
  });
  it("distinguishes open visits from measured durations", () => {
    expect(duration("2026-10-30T10:00:00", null)).toBe("En el gimnasio");
    expect(duration("2026-10-30T10:00:00", "2026-10-30T11:30:00")).toBe(
      "1 h 30 min",
    );
  });
  it("rejects malformed expiration data", () => {
    expect(tokenExpiry("invalid")).toBe(0);
    expect(tokenExpiry("a." + btoa('{"exp":123}') + ".c")).toBe(123000);
  });
});

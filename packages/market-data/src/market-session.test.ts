import { describe, expect, it } from "vitest";

import { getMarketSession } from "./market-session";

const nse = {
  id: "nse",
  name: "National Stock Exchange of India",
  countryCode: "IN",
  region: "asia-pacific" as const,
  currency: "INR",
  timezone: "Asia/Kolkata",
  regularSession: {
    open: "09:15",
    close: "15:30",
  },
};

describe("getMarketSession", () => {
  it("reports pre-market before the regular session", () => {
    const session = getMarketSession(
      nse,
      new Date("2026-09-07T03:00:00Z"),
    );

    expect(session.status).toBe("pre-market");
    expect(session.localTime).toBe("08:30");
  });

  it("reports open during the regular session", () => {
    const session = getMarketSession(
      nse,
      new Date("2026-09-07T05:30:00Z"),
    );

    expect(session.status).toBe("open");
    expect(session.localTime).toBe("11:00");
  });

  it("reports post-market after the regular session", () => {
    const session = getMarketSession(
      nse,
      new Date("2026-09-07T11:00:00Z"),
    );

    expect(session.status).toBe("post-market");
    expect(session.localTime).toBe("16:30");
  });

  it("reports closed on weekends", () => {
    const session = getMarketSession(
      nse,
      new Date("2026-09-05T06:00:00Z"),
    );

    expect(session.status).toBe("closed");
  });
});
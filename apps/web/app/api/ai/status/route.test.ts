import {
  describe,
  expect,
  it,
} from "vitest";

import {
  GET,
} from "./route";

describe("GET /api/ai/status", () => {
  it("returns AI provider health", async () => {
    const response =
      await GET();

    expect(response.status).toBe(
      200,
    );

    const body =
      await response.json();

    expect(body.data).toBeDefined();

    expect(body.data.status).toBe(
      "healthy",
    );

    expect(
      body.data.providers,
    ).toHaveLength(1);

    expect(
      body.data.providers[0],
    ).toMatchObject({
      providerId: "demo-ai",
      providerName:
        "TickerApp Demo AI",
      model:
        "deterministic-research-v1",
      status: "healthy",
    });

    expect(
      body.data.checkedAt,
    ).toBeTruthy();
  });
});
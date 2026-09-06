import {
  describe,
  expect,
  it,
} from "vitest";

import {
  GET,
} from "./route";

describe("GET /api/ai/providers", () => {
  it("returns registered AI providers", async () => {
    const response =
      await GET();

    expect(response.status).toBe(
      200,
    );

    const body =
      await response.json();

    expect(
      body.data,
    ).toHaveLength(1);

    expect(
      body.data[0],
    ).toEqual({
      id: "demo-ai",
      name: "TickerApp Demo AI",
      model:
        "deterministic-research-v1",
      capabilities: {
        research: true,
      },
    });
  });
});
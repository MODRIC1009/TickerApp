
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();

  const globalForAI = globalThis as typeof globalThis & {
    tickerAIContainer?: unknown;
  };

  delete globalForAI.tickerAIContainer;
});

describe("GET /api/ai/status", () => {
  it("reports unavailable when AI is not configured", async () => {
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_BASE_URL", "");
    vi.stubEnv("AI_MODEL", "");

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.data.status).toBe("unavailable");
    expect(body.data.providers).toHaveLength(1);

    expect(body.data.providers[0]).toMatchObject({
      providerId: "ai-unconfigured",
      providerName: "AI Not Configured",
      model: "none",
      status: "unavailable",
    });

    expect(body.data.checkedAt).toBeTruthy();
  });
});

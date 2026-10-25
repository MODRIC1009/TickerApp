
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

describe("GET /api/ai/providers", () => {
  it("returns the unconfigured provider when AI is not configured", async () => {
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_BASE_URL", "");
    vi.stubEnv("AI_MODEL", "");

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.data).toEqual([
      {
        id: "ai-unconfigured",
        name: "AI Not Configured",
        model: "none",
        capabilities: {
          research: true,
        },
      },
    ]);
  });
});

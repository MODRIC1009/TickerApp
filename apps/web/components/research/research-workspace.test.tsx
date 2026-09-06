// @vitest-environment jsdom

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  ResearchWorkspace,
} from "./research-workspace";

import type {
  ResearchResult,
} from "@tickerapp/ai";

const researchResult: ResearchResult = {
  instrument: {
    symbol: "AAPL",
    name: "Apple Inc.",
    exchangeId: "NASDAQ",
    countryCode: "US",
    currency: "USD",
    assetClass: "equity",
  },
  generatedAt:
    "2026-09-06T10:00:00.000Z",
  providerId: "demo-ai",
  model:
    "deterministic-research-v1",
  thesis:
    "Balanced research thesis for Apple.",
  bullCase: [
    "Strong growth.",
  ],
  bearCase: [
    "Valuation risk.",
  ],
  catalysts: [
    "Upcoming earnings.",
  ],
  risks: [
    "Market risk.",
  ],
  sections: [
    {
      title:
        "Financial Quality",
      summary:
        "Financial quality overview.",
      keyPoints: [
        "Review fundamentals.",
      ],
    },
  ],
  evidence: [
    {
      source:
        "TickerApp supplied market data",
      claim:
        "Supplied data was used.",
      relevance: "high",
    },
  ],
  confidence: "low",
  limitations: [
    "Demo provider limitation.",
  ],
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe(
  "ResearchWorkspace",
  () => {
    it("renders the initial research workspace", () => {
      render(
        <ResearchWorkspace />,
      );

      expect(
        screen.getByText(
          "Research the market.",
        ),
      ).toBeDefined();

      expect(
        screen.getByText(
          "Your research workspace is ready.",
        ),
      ).toBeDefined();

      expect(
        screen.getByDisplayValue(
          "AAPL",
        ),
      ).toBeDefined();

      expect(
        screen.getByDisplayValue(
          "Give me a balanced fundamental and risk overview.",
        ),
      ).toBeDefined();
    });

    it("submits a research request and renders the result", async () => {
      const fetchMock =
        vi
          .spyOn(
            globalThis,
            "fetch",
          )
          .mockResolvedValue(
            new Response(
              JSON.stringify({
                data:
                  researchResult,
              }),
              {
                status: 200,
                headers: {
                  "content-type":
                    "application/json",
                },
              },
            ),
          );

      render(
        <ResearchWorkspace />,
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name: "Run AI Research",
          },
        ),
      );

      await waitFor(() => {
        expect(
          screen.getByText(
            "Balanced research thesis for Apple.",
          ),
        ).toBeDefined();
      });

      expect(
        screen.getByText(
          "Bull Case",
        ),
      ).toBeDefined();

      expect(
        screen.getByText(
          "Bear Case",
        ),
      ).toBeDefined();

      expect(
        screen.getByText(
          "Demo provider limitation.",
        ),
      ).toBeDefined();

      expect(
        fetchMock,
      ).toHaveBeenCalledTimes(1);
    });

    it("shows a loading state while research is running", async () => {
      let resolveRequest:
        | ((response: Response) => void)
        | undefined;

      vi
        .spyOn(
          globalThis,
          "fetch",
        )
        .mockImplementation(
          () =>
            new Promise(
              (resolve) => {
                resolveRequest =
                  resolve;
              },
            ),
        );

      render(
        <ResearchWorkspace />,
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name: "Run AI Research",
          },
        ),
      );

      expect(
        screen.getByText(
          "Generating research...",
        ),
      ).toBeDefined();

      resolveRequest?.(
        new Response(
          JSON.stringify({
            data:
              researchResult,
          }),
          {
            status: 200,
          },
        ),
      );

      await waitFor(() => {
        expect(
          screen.getByText(
            "Balanced research thesis for Apple.",
          ),
        ).toBeDefined();
      });
    });

    it("shows an API error", async () => {
      vi
        .spyOn(
          globalThis,
          "fetch",
        )
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              error:
                "AI provider is unavailable.",
              code:
                "provider_unavailable",
              providerId:
                "openai-compatible",
            }),
            {
              status: 502,
            },
          ),
        );

      render(
        <ResearchWorkspace />,
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name: "Run AI Research",
          },
        ),
      );

      await waitFor(() => {
        expect(
          screen.getByText(
            "AI provider is unavailable.",
          ),
        ).toBeDefined();
      });
    });

    it("updates the research question from a quick question", () => {
      render(
        <ResearchWorkspace />,
      );

      const question =
        screen.getByLabelText(
          "Research Question",
        ) as HTMLTextAreaElement;

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name: "What are the main bull and bear cases?",
          },
        ),
      );

      expect(
        question.value,
      ).toBe(
        "What are the main bull and bear cases?",
      );
    });
  },
);
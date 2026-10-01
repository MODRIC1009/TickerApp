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

const instrument = {
  symbol: "AAPL",
  name: "Apple Inc.",
  exchangeId: "NASDAQ",
  countryCode: "US",
  currency: "USD",
  assetClass: "equity" as const,
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ResearchWorkspace", () => {
  it("renders the current research terminal", () => {
    render(<ResearchWorkspace />);

    expect(
      screen.getByText("Research a security"),
    ).toBeDefined();

    expect(
      screen.getByText("Research terminal ready"),
    ).toBeDefined();

    expect(
      screen.getByDisplayValue("AAPL"),
    ).toBeDefined();

    expect(
      screen.getByRole("button", {
        name: "Research security",
      }),
    ).toBeDefined();
  });

  it("loads the selected security and renders its identity", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            instrument,
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

    render(<ResearchWorkspace />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Research security",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Apple Inc."),
      ).toBeDefined();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/market-data/instrument?symbol=AAPL",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it("shows a loading state while the security lookup is running", () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () => new Promise<Response>(() => undefined),
    );

    render(<ResearchWorkspace />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Research security",
      }),
    );

    expect(
      screen.getByText("Loading"),
    ).toBeDefined();
  });

  it("shows an API error when the security lookup fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "Instrument not found.",
        }),
        {
          status: 404,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    render(<ResearchWorkspace />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Research security",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Instrument not found."),
      ).toBeDefined();
    });

    expect(
      screen.getByRole("alert"),
    ).toBeDefined();
  });

  it("loads a security from a quick research symbol", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          instrument: {
            ...instrument,
            symbol: "NVDA",
            name: "NVIDIA Corporation",
            exchangeId: "NASDAQ",
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    render(<ResearchWorkspace />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "NVDA",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("NVIDIA Corporation"),
      ).toBeDefined();
    });

    expect(
      screen.getByDisplayValue("NVDA"),
    ).toBeDefined();
  });
});

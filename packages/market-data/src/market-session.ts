import type { Exchange } from "@tickerapp/shared";

import {
  WeekdayTradingCalendar,
  type TradingCalendar,
} from "./trading-calendar";

export type MarketSessionStatus =
  | "pre-market"
  | "open"
  | "post-market"
  | "closed";

export interface MarketSession {
  status: MarketSessionStatus;
  localTime: string;
  nextOpenAt?: string;
  nextCloseAt?: string;
}

export function getMarketSession(
  exchange: Exchange,
  now: Date = new Date(),
  calendar: TradingCalendar = new WeekdayTradingCalendar(),
): MarketSession {
  const localTimeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: exchange.timezone,
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).formatToParts(now);

  const values = Object.fromEntries(
    localTimeParts.map((part) => [part.type, part.value]),
  );

  const weekday = values.weekday;
  const hour = Number(values.hour);
  const minute = Number(values.minute);

  const currentMinutes = hour * 60 + minute;
  const openMinutes = toMinutes(exchange.regularSession.open);
  const closeMinutes = toMinutes(exchange.regularSession.close);

  if (
    weekday === "Sat" ||
    weekday === "Sun" ||
    !calendar.isTradingDay(exchange, now)
  ) {
    return {
      status: "closed",
      localTime: formatLocalTime(hour, minute),
    };
  }

  if (currentMinutes < openMinutes) {
    return {
      status: "pre-market",
      localTime: formatLocalTime(hour, minute),
    };
  }

  if (currentMinutes < closeMinutes) {
    return {
      status: "open",
      localTime: formatLocalTime(hour, minute),
    };
  }

  return {
    status: "post-market",
    localTime: formatLocalTime(hour, minute),
  };
}

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);

  return hours * 60 + minutes;
}

function formatLocalTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
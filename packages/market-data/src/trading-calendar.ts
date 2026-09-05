import type { Exchange } from "@tickerapp/shared";

export interface TradingCalendar {
  isTradingDay(exchange: Exchange, date: Date): boolean;
}

export class WeekdayTradingCalendar implements TradingCalendar {
  isTradingDay(_exchange: Exchange, date: Date): boolean {
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: _exchange.timezone,
      weekday: "short",
    }).format(date);

    return weekday !== "Sat" && weekday !== "Sun";
  }
}
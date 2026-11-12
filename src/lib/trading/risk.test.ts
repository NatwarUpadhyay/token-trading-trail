import { describe, expect, it } from "vitest";
import { checkOrder, DEFAULT_LIMITS, liveTradingAllowed, LIVE_CONFIRMATION_PHRASE, type RiskState } from "./risk";

const base: RiskState = { openPositions: 0, dailyPnl: 0, dayStartEquity: 10000, equity: 10000, lastOrderAt: null, killSwitch: false };
const buy = (notional: number) => ({ side: "buy" as const, notional, opensPosition: true });

describe("risk layer", () => {
  it("rejects orders above $1000 notional", () => {
    expect(checkOrder(buy(1001), base, DEFAULT_LIMITS, 0).ok).toBe(false);
    expect(checkOrder(buy(1000), base, DEFAULT_LIMITS, 0).ok).toBe(true);
  });
  it("blocks a 6th concurrent position", () => {
    expect(checkOrder(buy(100), { ...base, openPositions: 5 }, DEFAULT_LIMITS, 0).ok).toBe(false);
  });
  it("enforces 5s cooldown", () => {
    expect(checkOrder(buy(100), { ...base, lastOrderAt: 1000 }, DEFAULT_LIMITS, 5999).ok).toBe(false);
    expect(checkOrder(buy(100), { ...base, lastOrderAt: 1000 }, DEFAULT_LIMITS, 6000).ok).toBe(true);
  });
  it("stops new entries after $5000 daily loss or 10% drawdown", () => {
    expect(checkOrder(buy(100), { ...base, dailyPnl: -5000 }, DEFAULT_LIMITS, 0).ok).toBe(false);
    expect(checkOrder(buy(100), { ...base, equity: 9000 }, DEFAULT_LIMITS, 0).ok).toBe(false);
  });
  it("kill switch blocks everything", () => {
    expect(checkOrder({ side: "sell", notional: 10, opensPosition: false }, { ...base, killSwitch: true }, DEFAULT_LIMITS, 0).ok).toBe(false);
  });
  it("live trading needs both gates", () => {
    expect(liveTradingAllowed(true, LIVE_CONFIRMATION_PHRASE)).toBe(false);
    expect(liveTradingAllowed(false, "yes")).toBe(false);
    expect(liveTradingAllowed(false, LIVE_CONFIRMATION_PHRASE)).toBe(true);
  });
});

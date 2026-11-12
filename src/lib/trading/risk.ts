/** Deterministic risk layer — mirrors the hard limits from the original agent's .env. */
export type RiskLimits = {
  maxNotionalPerTrade: number;
  maxDailyLoss: number;
  maxDailyDrawdownPct: number;
  maxConcurrentPositions: number;
  orderCooldownSec: number;
};
export const DEFAULT_LIMITS: RiskLimits = {
  maxNotionalPerTrade: 1000,
  maxDailyLoss: 5000,
  maxDailyDrawdownPct: 10,
  maxConcurrentPositions: 5,
  orderCooldownSec: 5,
};
export type RiskState = {
  openPositions: number;
  dailyPnl: number;
  dayStartEquity: number;
  equity: number;
  lastOrderAt: number | null;
  killSwitch: boolean;
};
export type OrderIntent = { side: "buy" | "sell"; notional: number; opensPosition: boolean };
export type RiskResult = { ok: true } | { ok: false; reason: string };

export function checkOrder(o: OrderIntent, s: RiskState, l: RiskLimits, now: number): RiskResult {
  if (s.killSwitch) return { ok: false, reason: "Kill switch is engaged" };
  if (o.notional <= 0) return { ok: false, reason: "Order size must be positive" };
  if (o.notional > l.maxNotionalPerTrade) return { ok: false, reason: `Order exceeds max $${l.maxNotionalPerTrade} per trade` };
  if (s.lastOrderAt != null && now - s.lastOrderAt < l.orderCooldownSec * 1000)
    return { ok: false, reason: `Cooldown: wait ${l.orderCooldownSec}s between orders` };
  if (o.opensPosition) {
    if (s.openPositions >= l.maxConcurrentPositions) return { ok: false, reason: `Max ${l.maxConcurrentPositions} open positions reached` };
    if (-s.dailyPnl >= l.maxDailyLoss) return { ok: false, reason: "Daily loss limit hit" };
    const dd = ((s.dayStartEquity - s.equity) / s.dayStartEquity) * 100;
    if (dd >= l.maxDailyDrawdownPct) return { ok: false, reason: "Daily drawdown limit hit" };
  }
  return { ok: true };
}

/** Live trading needs two separate gates, exactly as the original agent required. */
export const LIVE_CONFIRMATION_PHRASE = "I UNDERSTAND THIS USES REAL FUNDS";
export function liveTradingAllowed(dryRun: boolean, confirmation: string): boolean {
  return dryRun === false && confirmation === LIVE_CONFIRMATION_PHRASE;
}

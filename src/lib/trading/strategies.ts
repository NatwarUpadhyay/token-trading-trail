import type { Candle } from "./market";
import { rsi, sma } from "./indicators";

export type Signal = 1 | -1 | 0; // 1 = enter long, -1 = exit, 0 = hold
export type StrategyId = "ma_cross" | "rsi_revert";
export type StrategyParams = { fast: number; slow: number; rsiPeriod: number; rsiLow: number; rsiHigh: number };
export const DEFAULT_PARAMS: StrategyParams = { fast: 10, slow: 30, rsiPeriod: 14, rsiLow: 30, rsiHigh: 70 };

export const STRATEGIES: Record<StrategyId, { name: string; desc: string }> = {
  ma_cross: { name: "MA Crossover", desc: "Long when fast SMA crosses above slow SMA, exit on cross below." },
  rsi_revert: { name: "RSI Mean Reversion", desc: "Long when RSI drops below the low band, exit above the high band." },
};

export function signals(c: Candle[], id: StrategyId, p: StrategyParams): Signal[] {
  const close = c.map((x) => x.c);
  if (id === "ma_cross") {
    const f = sma(close, p.fast), s = sma(close, p.slow);
    return close.map((_, i) => {
      const a = f[i], b = s[i], pa = f[i - 1], pb = s[i - 1];
      if (a == null || b == null || pa == null || pb == null) return 0;
      if (pa <= pb && a > b) return 1;
      if (pa >= pb && a < b) return -1;
      return 0;
    });
  }
  const r = rsi(close, p.rsiPeriod);
  return r.map((x) => (x == null ? 0 : x < p.rsiLow ? 1 : x > p.rsiHigh ? -1 : 0));
}

export type Trade = { entryT: number; exitT: number; entry: number; exit: number; pnl: number; r: number };
export type Kpis = { trades: number; winRate: number; profitFactor: number; maxDrawdown: number; expectancyR: number; totalReturn: number };

/** Long-only backtest. stopPct sets 1R; fee is per side (e.g. 0.001 = 0.1%). */
export function backtest(c: Candle[], id: StrategyId, p: StrategyParams, opts = { capital: 10000, stopPct: 0.02, fee: 0.001 }) {
  const sig = signals(c, id, p);
  let cash = opts.capital, qty = 0, entry = 0, entryT = 0, peak = opts.capital, maxDD = 0;
  const trades: Trade[] = [];
  const equity: { t: number; equity: number }[] = [];
  const close = (i: number, px: number) => {
    const gross = qty * px * (1 - opts.fee);
    const cost = qty * entry * (1 + opts.fee);
    trades.push({ entryT, exitT: c[i]!.t, entry, exit: px, pnl: gross - cost, r: (px - entry) / (entry * opts.stopPct) });
    cash += gross; qty = 0;
  };
  for (let i = 0; i < c.length; i++) {
    const px = c[i]!.c;
    if (qty > 0) {
      const stop = entry * (1 - opts.stopPct);
      if (c[i]!.l <= stop) close(i, stop);
      else if (sig[i] === -1) close(i, px);
    } else if (sig[i] === 1) {
      qty = (cash / (px * (1 + opts.fee))); entry = px; entryT = c[i]!.t; cash = 0;
    }
    const eq = cash + qty * px;
    peak = Math.max(peak, eq); maxDD = Math.max(maxDD, (peak - eq) / peak);
    equity.push({ t: c[i]!.t, equity: eq });
  }
  if (qty > 0) close(c.length - 1, c[c.length - 1]!.c);
  return { trades, equity, kpis: computeKpis(trades, maxDD, opts.capital, cash) };
}

export function computeKpis(trades: Trade[], maxDrawdown: number, start: number, end: number): Kpis {
  const wins = trades.filter((t) => t.pnl > 0);
  const gw = wins.reduce((s, t) => s + t.pnl, 0);
  const gl = -trades.filter((t) => t.pnl <= 0).reduce((s, t) => s + t.pnl, 0);
  return {
    trades: trades.length,
    winRate: trades.length ? wins.length / trades.length : 0,
    profitFactor: gl === 0 ? (gw > 0 ? Infinity : 0) : gw / gl,
    maxDrawdown,
    expectancyR: trades.length ? trades.reduce((s, t) => s + t.r, 0) / trades.length : 0,
    totalReturn: (end - start) / start,
  };
}

import { useCallback, useEffect, useState } from "react";
import { checkOrder, DEFAULT_LIMITS, type RiskLimits, type RiskResult } from "./risk";

export type Position = { id: string; symbol: string; qty: number; entry: number; sl: number; openedAt: number };
export type Fill = { id: string; symbol: string; side: "buy" | "sell"; qty: number; price: number; pnl?: number; t: number };
export type PaperAccount = {
  startCash: number; cash: number; positions: Position[]; fills: Fill[];
  dayStartEquity: number; dayKey: string; realizedToday: number; lastOrderAt: number | null;
  killSwitch: boolean; limits: RiskLimits;
};
const KEY = "paper-account-v1";
const today = () => new Date().toISOString().slice(0, 10);
const fresh = (): PaperAccount => ({
  startCash: 10000, cash: 10000, positions: [], fills: [], dayStartEquity: 10000, dayKey: today(),
  realizedToday: 0, lastOrderAt: null, killSwitch: false, limits: DEFAULT_LIMITS,
});
const FEE = 0.001;

export function equityOf(a: PaperAccount, prices: Record<string, number>) {
  return a.cash + a.positions.reduce((s, p) => s + p.qty * (prices[p.symbol] ?? p.entry), 0);
}

export function usePaperAccount() {
  const [acct, setAcct] = useState<PaperAccount>(fresh);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s) setAcct({ ...fresh(), ...JSON.parse(s) }); } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(acct)); }, [acct, loaded]);

  const rollDay = (a: PaperAccount, eq: number) => (a.dayKey === today() ? a : { ...a, dayKey: today(), dayStartEquity: eq, realizedToday: 0 });

  const buy = useCallback((symbol: string, notional: number, price: number, stopPct: number, prices: Record<string, number>): RiskResult => {
    const a = rollDay(acct, equityOf(acct, prices));
    const now = Date.now();
    const res = checkOrder({ side: "buy", notional, opensPosition: true }, {
      openPositions: a.positions.length, dailyPnl: a.realizedToday, dayStartEquity: a.dayStartEquity,
      equity: equityOf(a, prices), lastOrderAt: a.lastOrderAt, killSwitch: a.killSwitch,
    }, a.limits, now);
    if (!res.ok) return res;
    if (notional * (1 + FEE) > a.cash) return { ok: false, reason: "Not enough paper cash" };
    const qty = notional / price; const id = crypto.randomUUID();
    setAcct({ ...a, cash: a.cash - notional * (1 + FEE), lastOrderAt: now,
      positions: [...a.positions, { id, symbol, qty, entry: price, sl: price * (1 - stopPct), openedAt: now }],
      fills: [{ id, symbol, side: "buy" as const, qty, price, t: now }, ...a.fills].slice(0, 200) });
    return { ok: true };
  }, [acct]);

  const close = useCallback((id: string, price: number) => {
    setAcct((a) => {
      const p = a.positions.find((x) => x.id === id); if (!p) return a;
      const proceeds = p.qty * price * (1 - FEE); const pnl = proceeds - p.qty * p.entry * (1 + FEE);
      return { ...a, cash: a.cash + proceeds, realizedToday: a.realizedToday + pnl, positions: a.positions.filter((x) => x.id !== id),
        fills: [{ id: crypto.randomUUID(), symbol: p.symbol, side: "sell" as const, qty: p.qty, price, pnl, t: Date.now() }, ...a.fills].slice(0, 200) };
    });
  }, []);

  return {
    acct, buy, close,
    setKill: (v: boolean) => setAcct((a) => ({ ...a, killSwitch: v })),
    setLimits: (l: RiskLimits) => setAcct((a) => ({ ...a, limits: l })),
    reset: () => setAcct(fresh()),
  };
}

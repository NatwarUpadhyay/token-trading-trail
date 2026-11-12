import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shell, Stat, fmt } from "@/components/trading/Shell";
import { fetchPrices, SYMBOLS } from "@/lib/trading/market";
import { equityOf, usePaperAccount } from "@/lib/trading/paper";
import { pageHead } from "@/lib/trading/head";

export const Route = createFileRoute("/paper")({
  head: () => pageHead("Paper Trading — Algo Trading Agent", "Place simulated crypto trades on live prices, guarded by the same risk limits as live trading."),
  component: Paper,
});

const inp = "w-full rounded border border-input bg-card px-2 py-1.5 font-mono text-sm";

function Paper() {
  const { acct, buy, close, reset } = usePaperAccount();
  const prices = useQuery({ queryKey: ["prices"], queryFn: fetchPrices, refetchInterval: 5000 });
  const px = prices.data ?? {};
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [notional, setNotional] = useState(500);
  const [stop, setStop] = useState(2);

  // Deterministic stop-loss enforcement on every price tick.
  useEffect(() => {
    for (const p of acct.positions) {
      const cur = px[p.symbol];
      if (cur != null && cur <= p.sl) { close(p.id, cur); toast.warning(`Stop hit on ${p.symbol}`); }
    }
  }, [px, acct.positions, close]);

  const eq = equityOf(acct, px);
  const unreal = acct.positions.reduce((s, p) => s + p.qty * ((px[p.symbol] ?? p.entry) - p.entry), 0);
  const submit = () => {
    const price = px[symbol];
    if (!price) { toast.error("No live price yet"); return; }
    const r = buy(symbol, notional, price, stop / 100, px);
    if (r.ok) toast.success(`Bought ${fmt.usd(notional)} of ${symbol}`); else toast.error(r.reason);
  };

  return (
    <Shell>
      {acct.killSwitch && <div className="mb-4 rounded-md border border-destructive bg-destructive/15 p-3 text-sm">Kill switch engaged — new orders are blocked. Release it on the Risk page.</div>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Equity" value={fmt.usd(eq)} />
        <Stat label="Cash" value={fmt.usd(acct.cash)} />
        <Stat label="Unrealized" value={fmt.usd(unreal)} tone={unreal >= 0 ? "gain" : "loss"} />
        <Stat label="Realized today" value={fmt.usd(acct.realizedToday)} tone={acct.realizedToday >= 0 ? "gain" : "loss"} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3 rounded-md border border-border bg-card p-4">
          <h1 className="font-semibold">Order ticket</h1>
          <label className="block text-xs text-muted-foreground">Symbol
            <select className={inp} value={symbol} onChange={(e) => setSymbol(e.target.value)}>{SYMBOLS.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="block text-xs text-muted-foreground">Size (USD)<input type="number" className={inp} value={notional} onChange={(e) => setNotional(+e.target.value)} /></label>
          <label className="block text-xs text-muted-foreground">Stop loss %<input type="number" step="0.5" className={inp} value={stop} onChange={(e) => setStop(+e.target.value)} /></label>
          <div className="font-mono text-xs text-muted-foreground">Price: {px[symbol] ? fmt.usd(px[symbol]) : "…"}</div>
          <button onClick={submit} className="w-full rounded bg-primary py-2 font-semibold text-primary-foreground hover:bg-primary/90">Buy (paper)</button>
          <button onClick={() => { if (confirm("Reset paper account to $10,000?")) reset(); }} className="w-full rounded border border-border py-1.5 text-sm text-muted-foreground hover:bg-accent">Reset account</button>
        </aside>
        <section className="space-y-4">
          <div className="rounded-md border border-border bg-card">
            <div className="border-b border-border p-3 font-semibold">Open positions ({acct.positions.length}/{acct.limits.maxConcurrentPositions})</div>
            <table className="w-full font-mono text-xs">
              <thead className="text-muted-foreground"><tr><th className="p-2 text-left">Symbol</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Entry</th><th className="p-2 text-right">Stop</th><th className="p-2 text-right">P&L</th><th /></tr></thead>
              <tbody>
                {acct.positions.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No open positions</td></tr>}
                {acct.positions.map((p) => { const cur = px[p.symbol] ?? p.entry; const pnl = p.qty * (cur - p.entry); return (
                  <tr key={p.id} className="border-t border-border"><td className="p-2">{p.symbol}</td><td className="p-2 text-right">{fmt.num(p.qty, 5)}</td><td className="p-2 text-right">{fmt.usd(p.entry)}</td><td className="p-2 text-right">{fmt.usd(p.sl)}</td>
                    <td className={`p-2 text-right ${pnl >= 0 ? "text-gain" : "text-loss"}`}>{fmt.usd(pnl)}</td>
                    <td className="p-2 text-right"><button onClick={() => close(p.id, cur)} className="rounded border border-border px-2 py-0.5 hover:bg-accent">Close</button></td></tr>); })}
              </tbody>
            </table>
          </div>
          <div className="max-h-80 overflow-auto rounded-md border border-border bg-card">
            <div className="border-b border-border p-3 font-semibold">Trade ledger</div>
            <table className="w-full font-mono text-xs"><tbody>
              {acct.fills.map((f) => (
                <tr key={f.id} className="border-t border-border"><td className="p-2 text-muted-foreground">{new Date(f.t).toLocaleString()}</td>
                  <td className={`p-2 ${f.side === "buy" ? "text-gain" : "text-loss"}`}>{f.side.toUpperCase()}</td><td className="p-2">{f.symbol}</td>
                  <td className="p-2 text-right">{fmt.usd(f.price)}</td><td className="p-2 text-right">{f.pnl != null ? fmt.usd(f.pnl) : ""}</td></tr>
              ))}
            </tbody></table>
          </div>
        </section>
      </div>
    </Shell>
  );
}

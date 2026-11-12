import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Shell, Stat, fmt } from "@/components/trading/Shell";
import { Pickers } from "@/components/trading/Pickers";
import { fetchCandles } from "@/lib/trading/market";
import { backtest, DEFAULT_PARAMS, STRATEGIES, type StrategyId } from "@/lib/trading/strategies";
import { pageHead } from "@/lib/trading/head";

export const Route = createFileRoute("/backtest")({
  head: () => pageHead("Backtest — Algo Trading Agent", "Backtest MA crossover and RSI strategies on real historical crypto data."),
  component: Backtest,
});

const num = "w-full rounded border border-input bg-card px-2 py-1.5 font-mono text-sm";

function Backtest() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("1h");
  const [id, setId] = useState<StrategyId>("ma_cross");
  const [p, setP] = useState(DEFAULT_PARAMS);
  const [stopPct, setStop] = useState(2);
  const candles = useQuery({ queryKey: ["candles-bt", symbol, interval], queryFn: () => fetchCandles(symbol, interval, 1000) });
  const res = useMemo(() => (candles.data ? backtest(candles.data, id, p, { capital: 10000, stopPct: stopPct / 100, fee: 0.001 }) : null), [candles.data, id, p, stopPct]);
  const field = (k: keyof typeof p, label: string) => (
    <label className="text-xs text-muted-foreground">{label}
      <input type="number" className={num} value={p[k]} onChange={(e) => setP({ ...p, [k]: Math.max(1, +e.target.value) })} />
    </label>
  );
  const k = res?.kpis;
  return (
    <Shell>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3 rounded-md border border-border bg-card p-4">
          <h1 className="font-semibold">Backtest setup</h1>
          <Pickers symbol={symbol} interval={interval} onSymbol={setSymbol} onInterval={setInterval} />
          <select aria-label="Strategy" className={num} value={id} onChange={(e) => setId(e.target.value as StrategyId)}>
            {(Object.keys(STRATEGIES) as StrategyId[]).map((s) => <option key={s} value={s}>{STRATEGIES[s].name}</option>)}
          </select>
          {id === "ma_cross" ? <>{field("fast", "Fast SMA")}{field("slow", "Slow SMA")}</> : <>{field("rsiPeriod", "RSI period")}{field("rsiLow", "Buy below")}{field("rsiHigh", "Sell above")}</>}
          <label className="text-xs text-muted-foreground">Stop loss %<input type="number" step="0.5" className={num} value={stopPct} onChange={(e) => setStop(Math.max(0.1, +e.target.value))} /></label>
          <p className="text-xs text-muted-foreground">Long-only · $10,000 start · 0.1% fee per side · last 1000 bars.</p>
        </aside>
        <section className="space-y-4">
          {candles.isError && <p className="text-loss">Couldn't load history.</p>}
          {k && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <Stat label="Return" value={fmt.pct(k.totalReturn)} tone={k.totalReturn >= 0 ? "gain" : "loss"} />
              <Stat label="Trades" value={String(k.trades)} />
              <Stat label="Win rate" value={fmt.pct(k.winRate)} />
              <Stat label="Profit factor" value={fmt.num(k.profitFactor)} />
              <Stat label="Max drawdown" value={fmt.pct(k.maxDrawdown)} tone="loss" />
              <Stat label="Expectancy" value={`${fmt.num(k.expectancyR)}R`} />
            </div>
          )}
          <div className="h-72 rounded-md border border-border bg-card p-3">
            <ResponsiveContainer>
              <AreaChart data={res?.equity ?? []}>
                <XAxis dataKey="t" tickFormatter={(t) => new Date(t).toLocaleDateString()} stroke="var(--muted-foreground)" fontSize={11} minTickGap={50} />
                <YAxis domain={["auto", "auto"]} stroke="var(--muted-foreground)" fontSize={11} width={70} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} labelFormatter={(t) => new Date(+t).toLocaleString()} formatter={(v: number) => fmt.usd(v)} />
                <Area dataKey="equity" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="max-h-80 overflow-auto rounded-md border border-border">
            <table className="w-full font-mono text-xs">
              <thead className="sticky top-0 bg-card text-muted-foreground"><tr><th className="p-2 text-left">Entry</th><th className="p-2 text-right">Entry px</th><th className="p-2 text-right">Exit px</th><th className="p-2 text-right">P&L</th><th className="p-2 text-right">R</th></tr></thead>
              <tbody>{res?.trades.slice().reverse().map((t) => (
                <tr key={t.entryT} className="border-t border-border"><td className="p-2">{new Date(t.entryT).toLocaleString()}</td><td className="p-2 text-right">{fmt.usd(t.entry)}</td><td className="p-2 text-right">{fmt.usd(t.exit)}</td>
                  <td className={`p-2 text-right ${t.pnl >= 0 ? "text-gain" : "text-loss"}`}>{fmt.usd(t.pnl)}</td><td className="p-2 text-right">{fmt.num(t.r)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      </div>
    </Shell>
  );
}

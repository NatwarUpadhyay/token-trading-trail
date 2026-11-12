import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { Shell, Stat, fmt } from "@/components/trading/Shell";
import { Pickers } from "@/components/trading/Pickers";
import { fetchCandles, fetchPrices, SYMBOLS } from "@/lib/trading/market";
import { rsi, sma } from "@/lib/trading/indicators";
import { DEFAULT_PARAMS, signals, STRATEGIES, type StrategyId } from "@/lib/trading/strategies";
import { pageHead } from "@/lib/trading/head";

export const Route = createFileRoute("/")({
  head: () => pageHead("Markets — Algo Trading Agent", "Live crypto prices, indicators and strategy signals for BTC, ETH, SOL and BNB."),
  component: Markets,
});

function Markets() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("1h");
  const prices = useQuery({ queryKey: ["prices"], queryFn: fetchPrices, refetchInterval: 5000 });
  const candles = useQuery({ queryKey: ["candles", symbol, interval], queryFn: () => fetchCandles(symbol, interval, 300), refetchInterval: 30000 });

  const data = useMemo(() => {
    const c = candles.data ?? [];
    const close = c.map((x) => x.c);
    const f = sma(close, DEFAULT_PARAMS.fast), s = sma(close, DEFAULT_PARAMS.slow), r = rsi(close);
    return c.map((x, i) => ({ t: x.t, close: x.c, fast: f[i], slow: s[i], rsi: r[i] })).slice(-150);
  }, [candles.data]);

  const latest = (id: StrategyId) => {
    const sig = signals(candles.data ?? [], id, DEFAULT_PARAMS);
    for (let i = sig.length - 1; i >= 0; i--) if (sig[i] !== 0) return { s: sig[i], t: candles.data![i]!.t, bars: sig.length - 1 - i };
    return null;
  };
  const tick = (t: number) => new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit" });

  return (
    <Shell>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {SYMBOLS.map((s) => (
          <button key={s} onClick={() => setSymbol(s)} className={`rounded-md border p-3 text-left ${s === symbol ? "border-primary" : "border-border"} bg-card`}>
            <div className="text-xs text-muted-foreground">{s}</div>
            <div className="font-mono text-lg">{prices.data?.[s] != null ? fmt.usd(prices.data[s]!) : "…"}</div>
          </button>
        ))}
      </div>
      {prices.isError && <p className="mt-3 text-sm text-loss">Live prices unavailable right now.</p>}

      <section className="mt-6 rounded-md border border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-semibold">{symbol} · price with SMA {DEFAULT_PARAMS.fast}/{DEFAULT_PARAMS.slow}</h1>
          <Pickers symbol={symbol} interval={interval} onSymbol={setSymbol} onInterval={setInterval} />
        </div>
        <div className="h-80">
          <ResponsiveContainer>
            <LineChart data={data}>
              <XAxis dataKey="t" tickFormatter={tick} stroke="var(--muted-foreground)" fontSize={11} minTickGap={40} />
              <YAxis domain={["auto", "auto"]} stroke="var(--muted-foreground)" fontSize={11} width={70} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} labelFormatter={(t) => tick(+t)} />
              <Line dataKey="close" stroke="var(--foreground)" dot={false} strokeWidth={1.5} />
              <Line dataKey="fast" stroke="var(--chart-1)" dot={false} />
              <Line dataKey="slow" stroke="var(--chart-2)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 h-28">
          <ResponsiveContainer>
            <LineChart data={data}>
              <XAxis dataKey="t" hide /><YAxis domain={[0, 100]} ticks={[30, 70]} stroke="var(--muted-foreground)" fontSize={11} width={70} />
              <ReferenceLine y={30} stroke="var(--gain)" strokeDasharray="3 3" /><ReferenceLine y={70} stroke="var(--loss)" strokeDasharray="3 3" />
              <Line dataKey="rsi" stroke="var(--chart-3)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-2">
        {(Object.keys(STRATEGIES) as StrategyId[]).map((id) => {
          const l = latest(id);
          return (
            <div key={id} className="rounded-md border border-border bg-card p-4">
              <div className="font-semibold">{STRATEGIES[id].name}</div>
              <p className="text-sm text-muted-foreground">{STRATEGIES[id].desc}</p>
              <div className="mt-3 font-mono text-sm">
                {l ? <span className={l.s === 1 ? "text-gain" : "text-loss"}>{l.s === 1 ? "LONG" : "EXIT"} signal · {l.bars} bars ago</span> : <span className="text-muted-foreground">No recent signal</span>}
              </div>
            </div>
          );
        })}
      </section>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Last RSI" value={fmt.num(data.at(-1)?.rsi ?? NaN, 1)} />
        <Stat label="Fast SMA" value={data.at(-1)?.fast ? fmt.usd(data.at(-1)!.fast!) : "—"} />
        <Stat label="Slow SMA" value={data.at(-1)?.slow ? fmt.usd(data.at(-1)!.slow!) : "—"} />
        <Stat label="Data source" value="Binance public" />
      </div>
    </Shell>
  );
}

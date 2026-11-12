import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/trading/Shell";
import { pageHead } from "@/lib/trading/head";

export const Route = createFileRoute("/roadmap")({
  head: () => pageHead("Roadmap — Algo Trading Agent", "From demo testing to exchange testnet to small live trading."),
  component: Roadmap,
});

const PHASES: { title: string; items: [string, boolean][] }[] = [
  { title: "Phase 1 · Demo testing", items: [["Live prices & candles", true], ["MA crossover + RSI strategies", true], ["Backtester with KPIs", true], ["Paper trading with stops", true], ["Risk limits & kill switch", true], ["Save account & history in the cloud", false], ["Automatic paper trading on new candles", false], ["Market-structure signals (FVG, order blocks)", false]] },
  { title: "Phase 2 · Exchange testnet", items: [["Binance testnet keys, server-only orders", false], ["Fill sync & reconciliation", false], ["Telegram / webhook alerts", false], ["AI advisor review queue (never trades)", false]] },
  { title: "Phase 3 · Live, small size", items: [["Two-gate live switch", false], ["Tiny starting limits + daily reports", false], ["Solana DEX adapter", false]] },
  { title: "UI features", items: [["Candlestick chart with trade markers", false], ["Paper equity history", false], ["Strategy comparison", false]] },
];

function Roadmap() {
  return (
    <Shell>
      <h1 className="mb-4 text-2xl font-semibold">Roadmap</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {PHASES.map((p) => (
          <section key={p.title} className="rounded-md border border-border bg-card p-4">
            <h2 className="mb-2 font-semibold text-primary">{p.title}</h2>
            <ul className="space-y-1 text-sm">{p.items.map(([t, d]) => <li key={t} className={d ? "" : "text-muted-foreground"}>{d ? "✓" : "○"} {t}</li>)}</ul>
          </section>
        ))}
      </div>
    </Shell>
  );
}

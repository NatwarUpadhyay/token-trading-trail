import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/trading/Shell";
import { usePaperAccount } from "@/lib/trading/paper";
import { DEFAULT_LIMITS, LIVE_CONFIRMATION_PHRASE, type RiskLimits } from "@/lib/trading/risk";
import { pageHead } from "@/lib/trading/head";

export const Route = createFileRoute("/risk")({
  head: () => pageHead("Risk & Live Trading — Algo Trading Agent", "Hard risk limits, kill switch and the two-gate path to live trading."),
  component: Risk,
});

const LABELS: Record<keyof RiskLimits, string> = {
  maxNotionalPerTrade: "Max size per trade (USD)", maxDailyLoss: "Max daily loss (USD)",
  maxDailyDrawdownPct: "Max daily drawdown (%)", maxConcurrentPositions: "Max open positions", orderCooldownSec: "Cooldown between orders (s)",
};

function Risk() {
  const { acct, setKill, setLimits } = usePaperAccount();
  const [phrase, setPhrase] = useState("");
  return (
    <Shell>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-border bg-card p-4">
          <h1 className="text-lg font-semibold">Hard limits</h1>
          <p className="mb-4 text-sm text-muted-foreground">Checked on every order before it is placed. Applies to paper trading now and to live trading later.</p>
          <div className="space-y-3">
            {(Object.keys(LABELS) as (keyof RiskLimits)[]).map((k) => (
              <label key={k} className="flex items-center justify-between gap-4 text-sm">{LABELS[k]}
                <input type="number" className="w-32 rounded border border-input bg-background px-2 py-1 text-right font-mono"
                  value={acct.limits[k]} onChange={(e) => setLimits({ ...acct.limits, [k]: Math.max(0, +e.target.value) })} /></label>
            ))}
          </div>
          <button onClick={() => setLimits(DEFAULT_LIMITS)} className="mt-4 text-sm text-muted-foreground underline">Restore defaults</button>
        </section>
        <section className="space-y-6">
          <div className="rounded-md border border-border bg-card p-4">
            <h2 className="font-semibold">Kill switch</h2>
            <p className="mb-3 text-sm text-muted-foreground">Instantly blocks all new orders.</p>
            <button onClick={() => setKill(!acct.killSwitch)} className={`w-full rounded py-3 font-bold ${acct.killSwitch ? "bg-destructive text-destructive-foreground" : "border border-destructive text-destructive hover:bg-destructive/10"}`}>
              {acct.killSwitch ? "ENGAGED — click to release" : "ENGAGE KILL SWITCH"}</button>
          </div>
          <div className="rounded-md border border-border bg-card p-4">
            <h2 className="font-semibold">Live trading</h2>
            <p className="mt-1 text-sm text-muted-foreground">Locked. Live trading needs two separate gates: dry-run turned off on the server, and this exact confirmation phrase. Exchange keys will be stored securely on the server — never in the browser.</p>
            <ol className="mt-3 space-y-1 text-sm">
              <li>☐ Exchange testnet keys connected</li><li>☐ 2+ weeks of paper results reviewed</li><li>☐ Server-side order execution enabled</li>
            </ol>
            <input value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder={LIVE_CONFIRMATION_PHRASE} className="mt-3 w-full rounded border border-input bg-background px-2 py-1.5 font-mono text-xs" />
            <button disabled className="mt-2 w-full cursor-not-allowed rounded border border-border py-2 text-sm text-muted-foreground">Go live (unavailable until Phase 3)</button>
          </div>
        </section>
      </div>
    </Shell>
  );
}

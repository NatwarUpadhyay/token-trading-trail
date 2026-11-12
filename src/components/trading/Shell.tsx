import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Markets" },
  { to: "/backtest", label: "Backtest" },
  { to: "/paper", label: "Paper Trading" },
  { to: "/risk", label: "Risk & Live" },
  { to: "/roadmap", label: "Roadmap" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-4 py-3">
          <div className="flex items-center gap-2 font-mono text-sm font-bold tracking-tight">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" /> ALGO//AGENT
          </div>
          <nav className="flex flex-wrap gap-1">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
                className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                activeProps={{ className: "bg-accent !text-foreground" }}>{n.label}</Link>
            ))}
          </nav>
          <span className="ml-auto rounded border border-primary/40 px-2 py-0.5 font-mono text-xs text-primary">DRY RUN · PAPER</span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: string; tone?: "gain" | "loss" }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-lg ${tone === "gain" ? "text-gain" : tone === "loss" ? "text-loss" : ""}`}>{value}</div>
    </div>
  );
}

export const fmt = {
  usd: (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: Math.abs(n) < 1 ? 4 : 2 }),
  pct: (n: number) => `${(n * 100).toFixed(2)}%`,
  num: (n: number, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : "∞"),
};

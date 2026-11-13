# Algo Trading Agent

A browser trading terminal for crypto strategies: live markets, strategy backtests,
paper trading with hard risk limits, and a staged path toward live trading.

**Status: paper only.** No real orders are placed anywhere. The paper account lives in
your browser's storage and starts at $10,000 of fake cash.

## What's here

| Page | What it does |
| --- | --- |
| **Markets** | Live prices for BTC, ETH, SOL and BNB (Binance public data), a price chart with moving averages, an RSI panel, and the latest signal from each strategy. |
| **Backtest** | Runs a strategy over real historical candles and reports return, win rate, profit factor, max drawdown and expectancy, with an equity curve and a trade list. |
| **Paper Trading** | An order ticket, open positions with live P&L and automatic stop-losses, and a fill ledger — all against the fake account. |
| **Risk & Live** | The hard limits every order must pass (per-trade size, daily loss, drawdown, concurrent positions, order cooldown), a kill switch, and the locked two-gate "go live" panel. |
| **Roadmap** | The three phases: demo testing, exchange testnet, then live at small size. |

## Where the logic lives

All trading logic is in plain TypeScript modules under `src/lib/trading/`, with no UI
imports, so it can move server-side unchanged:

- `market.ts` — candle and price fetching from Binance's public data endpoint.
- `indicators.ts` — moving averages and RSI.
- `strategies.ts` — signal generation and the long-only backtest engine.
- `risk.ts` — the deterministic risk layer: `checkOrder()` and the live-trading gate.
- `paper.ts` — the paper account: fills, positions, daily P&L, kill switch.

Tests for the risk layer are in `src/lib/trading/risk.test.ts` (run with `bunx vitest run`).

## Run it locally

```sh
git clone <this-repository-url>
cd <repository-name>
npm i        # or: bun install
npm run dev  # or: bun run dev
```

Then open the URL the dev server prints.

## Rules this project follows

- **Every order passes the risk layer.** No path — including the UI — may place an order
  without going through `checkOrder()`.
- **No AI call may place an order.** Any AI involvement is advisory only.
- **Exchange keys stay in server secrets.** They never go in this repository. Live trading
  needs two gates: the server dry-run flag turned off, and a typed confirmation phrase.

## Roadmap

See `roadmap.md` for the staged plan: demo testing first, then exchange testnet keys held
as server secrets, then live trading at a small size behind both gates.

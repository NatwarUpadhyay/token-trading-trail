# Roadmap — Crypto Algo Trading Agent

Imported from github.com/NatwarUpadhyay/crypto-algo-trading-agent (Python/FastAPI scaffold, mock data). Rebuilt as a web app.

## Phase 1 — Demo testing (in progress)
- [x] Live market prices + candles (Binance public data, no keys)
- [x] Strategies: MA crossover, RSI mean reversion
- [x] Backtester with KPIs (win rate, profit factor, max drawdown, expectancy R)
- [x] Paper trading account with stop losses and trade ledger
- [x] Deterministic risk layer (max size, daily loss, drawdown, positions, cooldown, kill switch) + tests
- [ ] Save paper account, trades and backtests in Lovable Cloud (sign-in, survives devices)
- [ ] Auto-trader: run a strategy on paper automatically on each new candle (server-side schedule)
- [ ] Market-structure signals from original API (fair value gaps, order blocks, liquidity sweeps)
- [ ] Walk-forward / multi-symbol backtests, parameter sweep

## Phase 2 — Exchange testnet
- [ ] Binance testnet keys stored as server secrets; orders placed by server only
- [ ] Order status sync, partial fills, reconciliation with the ledger
- [ ] Telegram / webhook alerts on fills, stops, limit breaches
- [ ] AI advisor (review queue): reviews backtests and proposes changes, never places orders

## Phase 3 — Live (small size)
- [ ] Two-gate live switch (server dry-run flag + typed confirmation)
- [ ] Very low starting limits, daily reports, auto kill switch on breach
- [ ] Solana DEX (Jupiter) adapter — needs a secure signing approach

## UI features
- [ ] Candlestick chart with trade markers
- [ ] Equity curve history for paper account
- [ ] Strategy comparison view, mobile layout polish

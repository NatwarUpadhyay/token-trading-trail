export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };

const BASE = "https://data-api.binance.vision/api/v3";
export const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"] as const;
export const INTERVALS = ["15m", "1h", "4h", "1d"] as const;

export async function fetchCandles(symbol: string, interval: string, limit = 500): Promise<Candle[]> {
  const r = await fetch(`${BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
  if (!r.ok) throw new Error(`Market data unavailable (${r.status})`);
  const rows = (await r.json()) as [number, string, string, string, string, string][];
  return rows.map((k) => ({ t: +k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5] }));
}

export async function fetchPrices(): Promise<Record<string, number>> {
  const r = await fetch(`${BASE}/ticker/price?symbols=${encodeURIComponent(JSON.stringify(SYMBOLS))}`);
  if (!r.ok) throw new Error("Price feed unavailable");
  const rows = (await r.json()) as { symbol: string; price: string }[];
  return Object.fromEntries(rows.map((p) => [p.symbol, +p.price]));
}

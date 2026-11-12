import { INTERVALS, SYMBOLS } from "@/lib/trading/market";

const cls = "rounded border border-input bg-card px-2 py-1.5 font-mono text-sm";
export function Pickers({ symbol, interval, onSymbol, onInterval }: { symbol: string; interval: string; onSymbol: (s: string) => void; onInterval: (s: string) => void }) {
  return (
    <div className="flex gap-2">
      <select aria-label="Symbol" className={cls} value={symbol} onChange={(e) => onSymbol(e.target.value)}>
        {SYMBOLS.map((s) => <option key={s}>{s}</option>)}
      </select>
      <select aria-label="Timeframe" className={cls} value={interval} onChange={(e) => onInterval(e.target.value)}>
        {INTERVALS.map((s) => <option key={s}>{s}</option>)}
      </select>
    </div>
  );
}

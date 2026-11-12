export function sma(v: number[], n: number): (number | null)[] {
  let s = 0;
  return v.map((x, i) => {
    s += x;
    if (i >= n) s -= v[i - n]!;
    return i >= n - 1 ? s / n : null;
  });
}

export function rsi(v: number[], n = 14): (number | null)[] {
  const out: (number | null)[] = v.map(() => null);
  let g = 0, l = 0;
  for (let i = 1; i < v.length; i++) {
    const d = v[i]! - v[i - 1]!;
    const up = Math.max(d, 0), dn = Math.max(-d, 0);
    if (i <= n) { g += up / n; l += dn / n; } else { g = (g * (n - 1) + up) / n; l = (l * (n - 1) + dn) / n; }
    if (i >= n) out[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
  }
  return out;
}

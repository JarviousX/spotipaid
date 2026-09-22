import { parseMoney } from "@/domain/money";
import type { TokenChartPoint } from "@/components/token/token-page-client";
import type { FeeHistoryPoint } from "@/services/catalog";
import type { DemoTrade } from "@/types/domain";

/** Build a demo-friendly price/volume/fee series for the token overview chart. */
export function buildTokenChartSeries(input: {
  priceUsd: string;
  launchedAt: string;
  trades: DemoTrade[];
  fees: FeeHistoryPoint[];
}): TokenChartPoint[] {
  const { priceUsd, launchedAt, trades, fees } = input;
  const price = Number(parseMoney(priceUsd).toString());
  const launch = new Date(launchedAt).getTime();
  const now = Date.now();
  const span = Math.max(now - launch, 7 * 86_400_000);
  const points = 12;

  const byBucket = new Map<string, TokenChartPoint>();

  for (let i = 0; i < points; i++) {
    const t = launch + (span * i) / (points - 1);
    const iso = new Date(t).toISOString();
    const progress = i / (points - 1);
    const wobble = Math.sin(progress * Math.PI * 2.4) * 0.08;
    const p = Math.max(0.0001, price * (0.55 + progress * 0.45 + wobble));
    byBucket.set(iso, {
      t: iso,
      label: new Date(t).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      price: Number(p.toFixed(6)),
      volume: 0,
      fees: 0,
    });
  }

  for (const trade of trades) {
    const iso = trade.timestamp;
    const key = [...byBucket.keys()].reduce((best, k) => {
      const d = Math.abs(new Date(k).getTime() - new Date(iso).getTime());
      const bd = Math.abs(new Date(best).getTime() - new Date(iso).getTime());
      return d < bd ? k : best;
    }, [...byBucket.keys()][0]);
    const point = byBucket.get(key);
    if (!point) continue;
    point.volume += Number(parseMoney(trade.amountUsd).toString());
    point.price = Number(parseMoney(trade.priceUsd).toString());
  }

  for (const fee of fees) {
    const iso = fee.timestamp;
    const keys = [...byBucket.keys()];
    if (!keys.length) continue;
    const key = keys.reduce((best, k) => {
      const d = Math.abs(new Date(k).getTime() - new Date(iso).getTime());
      const bd = Math.abs(new Date(best).getTime() - new Date(iso).getTime());
      return d < bd ? k : best;
    }, keys[0]);
    const point = byBucket.get(key);
    if (!point) continue;
    point.fees += Number(parseMoney(fee.grossAmount).toString());
  }

  return [...byBucket.values()].sort(
    (a, b) => new Date(a.t).getTime() - new Date(b.t).getTime(),
  );
}

"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyWinrate } from "@/lib/queries";

const SERIES_COLOR = "#3987e5"; // series-1, dark step
const GRIDLINE = "#2c2c2a";
const BASELINE = "#383835";
const MUTED = "#898781";
const SURFACE = "#1a1a19";

function formatDay(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: DailyWinrate }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-white/10 bg-surface-1 px-3 py-2 shadow-lg">
      <p className="text-xs text-text-secondary mb-1">{formatDay(point.day)}</p>
      <p className="text-sm font-semibold text-text-primary">{point.winrate.toFixed(0)}% winrate</p>
      <p className="text-xs text-text-muted">
        {point.wins}V / {point.losses}D
      </p>
    </div>
  );
}

export function WinrateChart({ data }: { data: DailyWinrate[] }) {
  if (data.length === 0) {
    return (
      <section className="rounded-2xl bg-surface-1 border border-white/10 shadow-xl shadow-black/40 p-6">
        <h2 className="text-sm font-semibold text-text-primary mb-1">Winrate por día</h2>
        <p className="text-sm text-text-muted">
          Todavía no hay suficientes partidas registradas para mostrar la gráfica.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-surface-1 border border-white/10 shadow-xl shadow-black/40 p-6">
      <h2 className="text-sm font-semibold text-text-primary mb-4">Winrate por día</h2>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid
              stroke={GRIDLINE}
              horizontal
              vertical={false}
              strokeWidth={1}
            />
            <XAxis
              dataKey="day"
              tickFormatter={formatDay}
              tick={{ fill: MUTED, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: BASELINE }}
              minTickGap={24}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fill: MUTED, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              cursor={{ stroke: BASELINE, strokeWidth: 1 }}
              content={<ChartTooltip />}
              wrapperStyle={{ outline: "none" }}
            />
            <Line
              type="monotone"
              dataKey="winrate"
              stroke={SERIES_COLOR}
              strokeWidth={2}
              dot={{ r: 3, fill: SERIES_COLOR, stroke: SURFACE, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: SERIES_COLOR, stroke: SURFACE, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

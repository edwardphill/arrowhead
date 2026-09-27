import type { ExpressionSpecification } from "maplibre-gl";
import { PERIODS, type PeriodId } from "@/lib/pointTypes";
import { formatBp } from "@/lib/timeline";

export default function PeriodLegend({
  hidden,
  onToggle,
}: {
  hidden: Set<PeriodId>;
  onToggle: (id: PeriodId) => void;
}) {
  return (
    <div className="card">
      <h3 className="card-title">Cultural periods</h3>
      <div className="flex flex-col gap-1">
        {PERIODS.map((p) => (
          <label key={p.id} htmlFor={`period-${p.id}`} className="flex cursor-pointer items-center gap-2 text-sm">
            <input id={`period-${p.id}`} type="checkbox" checked={!hidden.has(p.id)} onChange={() => onToggle(p.id)} />
            <span className="h-3 w-3 rounded-sm" style={{ background: p.color }} />
            {p.name}
            <span className="ml-auto font-mono text-xs text-muted">
              {formatBp(p.startBp)}–{formatBp(p.endBp)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

/** MapLibre expression that colors a feature by its "period" property. */
export const PERIOD_COLOR_EXPRESSION = [
  "match",
  ["get", "period"],
  ...PERIODS.flatMap((p) => [p.id, p.color]),
  "#888888",
] as unknown as ExpressionSpecification;

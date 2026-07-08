import type { Abstention, Differential, Routing, SprtViz } from "../types";

interface AbstentionSource {
  routing?: Routing | null;
  diffs?: Differential[];
  sprt?: SprtViz | null;
  escalated?: boolean;
}

export function deriveAbstention(res: AbstentionSource | null): Abstention {
  if (!res) return { boundary: false, multiple: false, unusual: false };
  const diffs = res.diffs || [];
  const confirmedCount = res.sprt?.confirmed?.length || 0;
  const boundary = res.routing === "GREY";
  const secondPct = diffs[1]?.pct ?? 0;
  const multiple = diffs.length >= 2 && secondPct >= 15;
  // unusual yalnız KARARSIZ bölgede anlamlı: net RED (red-flag/escalation) veya GREEN net karardır.
  const unusual = diffs.length > 0 && confirmedCount === 0 && (res.routing === "GREY" || res.routing === "YELLOW") && !res.escalated;
  return { boundary, multiple, unusual };
}

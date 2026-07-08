import type { Differential, ExtractedSymptoms, LlmParsedResponse, MatchResult, Routing } from "../types";

export function normalizeExtractedSymptoms(parsed: LlmParsedResponse, allTriggers: Set<string>): ExtractedSymptoms {
  const present = ((parsed.symptoms?.present || []) as string[]).filter((trigger: string) => allTriggers.has(trigger));
  const absent = ((parsed.symptoms?.absent || []) as string[]).filter((trigger: string) => allTriggers.has(trigger) && !present.includes(trigger));
  const confidence: Record<string, number> = {};

  for (const trigger of [...present, ...absent]) {
    const value = parsed.symptoms?.confidence?.[trigger];
    if (typeof value === "number" && value >= 0 && value <= 1) confidence[trigger] = value;
  }

  return { present, absent, confidence };
}

export function mergeDeterministicTriggers(baseSymptoms: ExtractedSymptoms, deterministicTriggers: string[]): ExtractedSymptoms {
  const present = [...new Set([...baseSymptoms.present, ...deterministicTriggers])];
  const absent = baseSymptoms.absent.filter(trigger => !present.includes(trigger));
  const confidence: Record<string, number> = {};

  for (const trigger of [...present, ...absent]) {
    const value = baseSymptoms.confidence?.[trigger];
    if (typeof value === "number" && value >= 0 && value <= 1 && !deterministicTriggers.includes(trigger)) {
      confidence[trigger] = value;
    }
  }

  return { present, absent, confidence };
}

export function buildSyntheticMatches(differentials: Differential[], routing: Routing | null): MatchResult[] {
  return differentials.slice(0, 5).map((differential, index) => ({
    name: differential.name || differential.condition || "—",
    icd: differential.icd || "—",
    triggerHits: Math.max(1, Math.round((differential.score || 50) / 20)),
    sprt_lr: differential.lr || differential.sprt_lr || 2.0,
    profileMod: differential.profileMod || 1.0,
    confirmatoryMet: index === 0,
    routing_if_confirmed: differential.routing || routing || "YELLOW",
    source: differential.source || "LLM clinical reasoning",
  }));
}

import { AKINATOR_QUESTIONS } from "./questions";
import { GATE_PATTERNS, MIN_QUESTIONS_BEFORE_DECISION, OFFLINE_PATTERNS, OFFLINE_PATTERN_NAMES_TR, OFFLINE_URGENCY_EN, OFFLINE_URGENCY_TR, PATTERNS } from "./patterns";
import { checkRedFlags, clinicalEscalation, escalationNote } from "./redFlags";
import { runSPRT, sprtDecide, sprtQuestionGain } from "./sprt";
import type { AkinatorQuestion, Lang, RiskMods } from "../types";

type GateId = string;

export function pickNextQuestion(
  askedIds: string[],
  selectedGate: GateId | null,
  collectedTriggers: string[],
  riskMods: RiskMods,
  answeredNo: string[],
  absentTriggers: string[],
) : AkinatorQuestion | null {
  const noSet = new Set(answeredNo || []);
  const pendingQs = AKINATOR_QUESTIONS.filter(q => {
    if (q.ask_if !== selectedGate) return false;
    if (askedIds.includes(q.id)) return false;
    // Ebeveyne hayır denildiyse bu soruyu atla
    if (q.depends_on && noSet.has(q.depends_on)) return false;
    return true;
  });
  if (pendingQs.length === 0) return null;
  if (pendingQs.length === 1) return pendingQs[0] as AkinatorQuestion;

  const gatePatterns = GATE_PATTERNS as Record<string, string[]>;
  const relevantPatterns = selectedGate && gatePatterns[selectedGate]
    ? [...new Set([...(gatePatterns[selectedGate] || []), ...OFFLINE_PATTERNS])]
    : OFFLINE_PATTERNS;
  const gateBonus = selectedGate ? (gatePatterns[selectedGate] || []) : [];
  const absent = absentTriggers || [];
  // SPRT durumu BİR kez hesaplanır; her aday soru bu duruma karşı puanlanır
  const state = runSPRT(relevantPatterns, collectedTriggers, absent, riskMods, gateBonus, PATTERNS, {});

  let bestQ = pendingQs[0] as AkinatorQuestion, bestGain = -1;
  for (const q of pendingQs) {
    const g = sprtQuestionGain(q, state, collectedTriggers, absent, relevantPatterns, PATTERNS);
    if (g > bestGain) { bestGain = g; bestQ = q as AkinatorQuestion; }
  }
  return bestQ;
}


// Kırmızı bayrak kombinasyonları — pattern tamamlanmasa bile direkt RED
// Her kural: { triggers: [gerekli triggerlar], min_any: kaçı yeterli, pattern, label_tr, label_en }

export function computeOfflineResult(
  collectedTriggers: string[],
  riskMods: RiskMods,
  askedCount: number,
  selectedGate: GateId | null,
  lang: Lang,
  force = false,
  absentTriggers: string[] = [],
) {
  const gatePatterns = GATE_PATTERNS as Record<string, string[]>;
  const relevantPatterns = selectedGate && gatePatterns[selectedGate]
    ? [...new Set([...(gatePatterns[selectedGate] || []), ...OFFLINE_PATTERNS])]
    : OFFLINE_PATTERNS;
  return sprtDecide({
    collected: collectedTriggers, absent: absentTriggers, riskMods, askedCount,
    gate: selectedGate, lang, force,
    patternKeys: relevantPatterns, PAT: PATTERNS,
    namesTR: OFFLINE_PATTERN_NAMES_TR, urgTR: OFFLINE_URGENCY_TR, urgEN: OFFLINE_URGENCY_EN,
    escalateFn: clinicalEscalation, escNoteFn: escalationNote, redFlagFn: checkRedFlags,
    minQuestions: MIN_QUESTIONS_BEFORE_DECISION, gatePatterns: GATE_PATTERNS,
  });
}

import type { Dispatch, RefObject, SetStateAction } from "react";

export type Lang = "tr" | "en";
export type UiPhase = "profiling" | "doc_upload" | "symptoms" | "decision";
export type Routing = "RED" | "YELLOW" | "GREEN" | "GREY";
export type PanelTab = "result" | "diff" | "system";
export type DocPhase = "idle" | "asking" | "uploading" | "done";
export type MessageRole = "shc" | "user";
export type HistoryRole = "user" | "assistant";
export type AkinatorAnswer = "yes" | "no" | "unsure";

export type StateSetter<T> = Dispatch<SetStateAction<T>>;

export interface Message {
  role: MessageRole;
  text: string;
  ts: number;
}

export interface ChatHistoryItem {
  role: HistoryRole;
  content: string;
}

export interface OnlineMessage {
  role: HistoryRole;
  content: unknown;
}

export interface OnlineContentBlock {
  type?: string;
  text?: string;
}

export interface OnlineResponse {
  content?: OnlineContentBlock[];
  model?: string;
  stop_reason?: string;
  usage?: unknown;
  online?: boolean;
  fallbackUsed?: boolean;
}

export interface OnlineBridgeData {
  text?: string;
  model?: string;
  stopReason?: string;
  usage?: unknown;
  requestId?: string | null;
  durationMs?: number | null;
}

export interface FollowUpItem {
  q: string;
  a: string;
}

export interface ProfileAnswers {
  [key: string]: string;
}

export interface ProfileQuestion {
  key: string;
  q: string;
  type: "choice" | "number";
  choices?: string[];
}

export interface PatientProfile {
  age?: number;
  sex?: string;
  height?: number;
  weight?: number;
  bmi?: number | null;
  pregnant?: boolean;
  chronic?: string;
  meds?: string;
  allergy?: string;
  smoking?: boolean;
  diabetes?: boolean;
  hypertension?: boolean;
  familyHistory?: boolean;
}

export type RiskMods = Record<string, number | undefined>;

export interface Differential {
  condition?: string;
  name?: string;
  icd?: string;
  pct?: number;
  probability?: number;
  score?: number;
  lr?: number;
  sprt_lr?: number;
  profileMod?: number;
  reasoning?: string;
  why?: string;
  risk?: string;
  routing?: Routing;
  source?: string;
}

export interface MatchResult {
  key?: string;
  id?: string;
  name?: string;
  icd?: string;
  score?: number;
  risk?: string;
  pattern?: string;
  triggers?: string[];
  triggerHits?: number;
  confirmatoryMet?: boolean;
  profileMod?: number;
  sprt_lr?: number;
  routing_if_confirmed?: Routing | string;
  source?: string;
  [key: string]: unknown;
}

export interface RoutingResult {
  routing?: Routing | null;
  urgency?: string | null;
  lambda?: number | null;
  doctorAlert?: string | null;
  sprt?: SprtViz | null;
  diffs?: Differential[];
}

export interface ClinicalEngineResult {
  routing: Routing;
  lambda: number;
  diffs: Differential[];
  sprt?: SprtViz | null;
  doctorAlert?: string | null;
  urgency?: string | null;
  pattern?: string;
  label?: string;
  escalated?: boolean;
  engine?: string;
}

export interface ClinicalPattern {
  name?: string;
  icd?: string;
  base_prevalence?: number;
  sprt_lr?: number;
  risk?: "critical" | "high" | "moderate" | "low" | string;
  triggers?: string[];
  required_any?: string[];
  confirmatory?: string[];
  routing_if_confirmed?: Routing | string;
  doctor_alert?: string;
  source?: string;
  lrOverrides?: Record<string, { plus?: number; minus?: number }>;
}

export type PatternMap = Record<string, ClinicalPattern>;

export interface SprtPerPattern {
  active: boolean;
  status: "inactive" | "confirmed" | "excluded" | "indeterminate";
  S: number;
  s0: number;
  traj: SprtTrajectoryPoint[];
  presRel: string[];
  absRel: string[];
  risk: string;
}

export interface SprtState {
  per: Record<string, SprtPerPattern>;
  confirmed: string[];
  indeterminate: string[];
  excluded: string[];
}

export interface SprtDecisionOptions {
  collected: string[];
  absent: string[];
  riskMods: RiskMods;
  askedCount: number;
  gate: string | null;
  lang: Lang;
  force: boolean;
  patternKeys: string[];
  PAT: PatternMap;
  namesTR: Record<string, string>;
  urgTR: Record<Routing, string>;
  urgEN: Record<Routing, string>;
  escalateFn: (routing: Routing, conditionId: string, triggers: string[]) => Routing;
  escNoteFn: (conditionId: string, triggers: string[], lang: Lang) => string;
  redFlagFn: (collectedTriggers: string[], lang: Lang) => ClinicalEngineResult | null;
  minQuestions: number;
  gatePatterns?: Record<string, string[]>;
  confMap?: Record<string, number>;
}

export interface SprtViz {
  rows?: unknown[];
  decision?: string;
  topKey?: string;
  S?: number | null;
  s0?: number;
  A?: number;
  B?: number;
  traj?: SprtTrajectoryPoint[];
  confirmed?: string[];
  excluded?: string[];
  abstained?: boolean;
  [key: string]: unknown;
}

export interface SprtTrajectoryPoint {
  t: string;
  y: number;
  S: number;
  present?: boolean;
}

export interface Abstention {
  boundary?: boolean;
  multiple?: boolean;
  unusual?: boolean;
  lowEvidence?: boolean;
  [key: string]: unknown;
}

export interface OnlineMeta {
  confirmed: boolean;
  model: string;
  requestCount: number;
  lastRequestId: string | null;
  lastDurationMs: number | null;
}

export interface ExtractedSymptoms {
  present: string[];
  absent: string[];
  confidence: Record<string, number>;
}

export interface LlmParsedResponse {
  text?: string;
  phase?: "collecting" | "decision";
  differentials?: Differential[];
  symptoms?: {
    present?: string[];
    absent?: string[];
    confidence?: Record<string, number>;
  };
  routing?: Routing | null;
  lambda?: number | null;
  urgency?: string | null;
  doctor_alert?: string | null;
  abstention?: Abstention;
}

export interface AkinatorQuestion {
  id: string;
  type?: "yn" | "scale";
  ask_if?: string;
  depends_on?: string;
  text?: string;
  text_tr?: string;
  text_en?: string;
  trigger?: string;
  triggers?: string[];
  triggers_yes?: string[];
  scale?: boolean;
  scale_trigger?: string;
  scale_high_triggers?: string[];
  [key: string]: unknown;
}

export interface AkinatorGate {
  id: string;
  label?: string;
  label_tr?: string;
  label_en?: string;
  sub?: string;
  sub_tr?: string;
  sub_en?: string;
  [key: string]: unknown;
}

export interface ThemeColors {
  [key: string]: string;
}

export interface RoutingLabel {
  label: string;
  sub?: string;
}

export interface UiFlag {
  k: keyof Abstention | string;
  label: string;
}

export interface TranslationPack {
  appSub?: string;
  tabResult: string;
  tabDiff: string;
  tabEngine: string;
  patientLabel: string;
  triageLabel: string;
  sprtLabel: string;
  qrLabel: string;
  safe: string;
  critical: string;
  alertLabel: string;
  uncertaintyLabel: string;
  diffLabel: string;
  diffEmpty: string;
  engineLabel: string;
  engineEmpty: string;
  sourcesLabel: string;
  awaiting: string;
  placeholder_symptom: string;
  hint: string;
  connError: string;
  profileComplete: (offline: boolean) => string;
  profileIntro: string;
  questions: ProfileQuestion[];
  validation: Record<string, string>;
  routing: Record<Routing, RoutingLabel>;
  uFlags: UiFlag[];
  [key: string]: unknown;
}

export type TextareaRef = RefObject<HTMLTextAreaElement | null>;
export type DivRef = RefObject<HTMLDivElement | null>;
export type FileInputRef = RefObject<HTMLInputElement | null>;

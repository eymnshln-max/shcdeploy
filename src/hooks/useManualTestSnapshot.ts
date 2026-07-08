import { useEffect } from "react";
import type {
  Abstention,
  Differential,
  ExtractedSymptoms,
  Lang,
  MatchResult,
  Message,
  OnlineMeta,
  PatientProfile,
  ProfileAnswers,
  Routing,
  SprtViz,
  UiPhase,
} from "../types";

export function useManualTestSnapshot({
  enabled,
  snapshotKey,
  lang,
  uiPhase,
  profile,
  profileAnswers,
  patientClinicalStatements,
  symptomText,
  extractedSymptoms,
  routing,
  urgency,
  lambda,
  diffs,
  matches,
  doctorAlert,
  abstention,
  sprtViz,
  docSummary,
  messages,
  onlineMeta,
  offlineMode,
  onlineTestError,
}: {
  enabled: boolean;
  snapshotKey: string;
  lang: Lang | null;
  uiPhase: UiPhase;
  profile: PatientProfile | null;
  profileAnswers: ProfileAnswers;
  patientClinicalStatements: string[];
  symptomText: string;
  extractedSymptoms: ExtractedSymptoms;
  routing: Routing | null;
  urgency: string | null;
  lambda: number | null;
  diffs: Differential[];
  matches: MatchResult[];
  doctorAlert: string | null;
  abstention: Abstention;
  sprtViz: SprtViz | null;
  docSummary: string;
  messages: Message[];
  onlineMeta: OnlineMeta;
  offlineMode: boolean;
  onlineTestError: string | null;
}) {
  useEffect(() => {
    if (!enabled || !lang) return;

    const canonicalExtracted = [
      ...extractedSymptoms.present,
      ...extractedSymptoms.absent.map((id) => `absent:${id}`),
    ];

    const snapshot = {
      version: 1,
      capturedAt: new Date().toISOString(),
      manualTestMode: true,
      onlineConfirmed: onlineMeta.confirmed && !offlineMode && !onlineTestError,
      onlineModel: onlineMeta.model,
      onlineRequestCount: onlineMeta.requestCount,
      onlineLastRequestId: onlineMeta.lastRequestId,
      onlineLastDurationMs: onlineMeta.lastDurationMs,
      fallbackUsed: offlineMode,
      onlineTestError,
      language: lang,
      uiPhase,
      profile,
      profileAnswers,
      patientClinicalStatements,
      symptomText,
      extractedSymptoms,
      extractedSymptomsCanonical: canonicalExtracted,
      routing,
      urgency,
      lambda,
      differentials: diffs,
      matches,
      doctorAlert,
      abstention,
      sprt: sprtViz,
      medicalDocumentSummary: docSummary,
      conversationTurns: patientClinicalStatements.length,
      transcript: messages.map((m) => `${m.role === "user" ? "HASTA" : "SHC"}: ${m.text}`).join("\n\n"),
    };

    try {
      localStorage.setItem(snapshotKey, JSON.stringify(snapshot));
      window.__SHC_TEST_SNAPSHOT__ = snapshot;
      window.dispatchEvent(new CustomEvent("standard-health:test-snapshot", { detail: snapshot }));
    } catch {}
  }, [
    enabled,
    snapshotKey,
    lang,
    uiPhase,
    profile,
    profileAnswers,
    patientClinicalStatements,
    symptomText,
    extractedSymptoms,
    routing,
    urgency,
    lambda,
    diffs,
    matches,
    doctorAlert,
    abstention,
    sprtViz,
    docSummary,
    messages,
    onlineMeta,
    offlineMode,
    onlineTestError,
  ]);
}

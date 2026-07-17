import { GATE_PATTERNS, OFFLINE_PATTERN_NAMES_TR, OFFLINE_URGENCY_EN, OFFLINE_URGENCY_TR, PATTERNS, ALL_TRIGGERS } from "../../clinical/patterns";
import { checkRedFlags, clinicalEscalation, escalationNote } from "../../clinical/redFlags";
import { EMERGENCY_PATTERNS } from "../../clinical/emergency";
import { extractDeterministicTriggers } from "../../clinical/deterministicTriggers";
import { matchPatterns } from "../../clinical/symptomMatching";
import { sprtDecide } from "../../clinical/sprt";
import { deriveAbstention } from "../../clinical/triage";
import { buildSystemPrompt } from "../../online/prompt";
import { trimHistory } from "../../online/conversation";
import { getSafeDisplayText, parseLlmJson } from "../../online/llmResponse";
import { buildSyntheticMatches, mergeDeterministicTriggers, normalizeExtractedSymptoms } from "../../online/symptomExtraction";
import type {
  Abstention,
  ChatHistoryItem,
  Differential,
  ExtractedSymptoms,
  FollowUpItem,
  Lang,
  MatchResult,
  MessageRole,
  OnlineMessage,
  OnlineResponse,
  PanelTab,
  PatientProfile,
  RiskMods,
  Routing,
  SprtViz,
  StateSetter,
  UiPhase,
} from "../../types";

interface UseOnlineAssessmentArgs {
  lang: Lang | null;
  offlineMode: boolean;
  symptomText: string;
  riskMods: RiskMods;
  history: ChatHistoryItem[];
  profile: PatientProfile | null;
  followUpHistory: FollowUpItem[];
  docSummary: string;
  addMsg: (text: string, role?: MessageRole) => void;
  callAPI: (system: string, messages: OnlineMessage[]) => Promise<OnlineResponse>;
  startAkinator: () => void;
  setPatientClinicalStatements: StateSetter<string[]>;
  setLoading: StateSetter<boolean>;
  setSymptomText: StateSetter<string>;
  setMatches: StateSetter<MatchResult[]>;
  setHistory: StateSetter<ChatHistoryItem[]>;
  setDiffs: StateSetter<Differential[]>;
  setLambda: StateSetter<number | null>;
  setExtractedSymptoms: StateSetter<ExtractedSymptoms>;
  setRouting: StateSetter<Routing | null>;
  setUrgency: StateSetter<string | null>;
  setSprtViz: StateSetter<SprtViz | null>;
  setDoctorAlert: StateSetter<string | null>;
  setUiPhase: StateSetter<UiPhase>;
  setPanelTab: StateSetter<PanelTab>;
  setAbstention: StateSetter<Abstention>;
  setFollowUpHistory: StateSetter<FollowUpItem[]>;
  setOnlineTestError: StateSetter<string | null>;
  setOfflineMode: StateSetter<boolean>;
}

export function useOnlineAssessment({
  lang,
  offlineMode,
  symptomText,
  riskMods,
  history,
  profile,
  followUpHistory,
  docSummary,
  addMsg,
  callAPI,
  startAkinator,
  setPatientClinicalStatements,
  setLoading,
  setSymptomText,
  setMatches,
  setHistory,
  setDiffs,
  setLambda,
  setExtractedSymptoms,
  setRouting,
  setUrgency,
  setSprtViz,
  setDoctorAlert,
  setUiPhase,
  setPanelTab,
  setAbstention,
  setFollowUpHistory,
  setOnlineTestError,
  setOfflineMode,
}: UseOnlineAssessmentArgs) {
  async function handleSymptomTurn(text: string) {
    if (!lang) return;
    setPatientClinicalStatements((prev) => [...prev, text]);
    if ((EMERGENCY_PATTERNS as Record<string, RegExp>)[lang]?.test(text)) {
      const emergencyMsg = lang === "tr"
        ? "Anlattıklarınız acil bir durum işareti taşıyor.\n\nLütfen hemen 112'yi arayın veya en yakın acil servise gidin. SHC'yi beklemeyin."
        : "What you've described may be an emergency.\n\nPlease call 911 immediately or go to your nearest ED. Do not wait for SHC.";
      addMsg(emergencyMsg);
      setLoading(false);
      return;
    }

    // Çevrimdışı modda Akinator başlat
    if (offlineMode) {
      startAkinator();
      return;
    }

    setLoading(true);
    const allSymptoms = (symptomText + " " + text).trim();
    setSymptomText(allSymptoms);
    const newMatches = matchPatterns(allSymptoms, riskMods);
    setMatches(newMatches);

    const rawHistory: ChatHistoryItem[] = [...history, {role:"user", content:text}];
    const trimmedHistory = trimHistory(rawHistory);
    setHistory(rawHistory);

    try {
      const data = await callAPI(
        buildSystemPrompt(lang, allSymptoms, profile, newMatches, followUpHistory, docSummary),
        trimmedHistory
      );
      const raw = data.content?.map((b) =>b.text||"").join("") || "";
      const parsed = parseLlmJson(raw, lang);
      const displayText = getSafeDisplayText(parsed, lang);
      addMsg(displayText);
      setHistory((h) => [...h, {role:"assistant", content:displayText}]);
      if (parsed.differentials?.length) setDiffs(parsed.differentials);
      if (parsed.lambda != null) setLambda(parsed.lambda);
      const baseSymptoms = normalizeExtractedSymptoms(parsed, ALL_TRIGGERS);
      setExtractedSymptoms(baseSymptoms);
      let engineRes = null;
      if (parsed.routing) {
        // Deterministic clinical safety net — fires regardless of LLM routing
        const dT = extractDeterministicTriggers(allSymptoms);
        const engineSymptoms = mergeDeterministicTriggers(baseSymptoms, dT);
        const enginePresent = engineSymptoms.present;
        const engineAbsent = engineSymptoms.absent;
        const confMap = engineSymptoms.confidence;
        setExtractedSymptoms(engineSymptoms);
        engineRes = enginePresent.length > 0 ? sprtDecide({
          collected: enginePresent, absent: engineAbsent, riskMods, askedCount: 999,
          gate: null, lang, force: true,
          patternKeys: Object.keys(PATTERNS), PAT: PATTERNS,
          namesTR: OFFLINE_PATTERN_NAMES_TR, urgTR: OFFLINE_URGENCY_TR, urgEN: OFFLINE_URGENCY_EN,
          escalateFn: clinicalEscalation, escNoteFn: escalationNote, redFlagFn: checkRedFlags,
          minQuestions: 0, gatePatterns: GATE_PATTERNS, confMap}) : null;

        let finalRouting: Routing = parsed.routing;
        let escId = "";
        if (engineRes?.routing) {
          // Güvenlik: motor kıt çıkarımla LLM'in RED'ini ASLA düşürmesin (yalnız yükseltebilir)
          const RANK: Record<string, number> = { RED:3, GREY:2, YELLOW:1, GREEN:0 };
          finalRouting = (parsed.routing && RANK[parsed.routing] > RANK[engineRes.routing])
            ? parsed.routing : engineRes.routing;
          const advisory = parsed.doctor_alert
            ? (lang==="tr" ? `LLM klinik notu (danışma): ${parsed.doctor_alert}` : `LLM clinical note (advisory): ${parsed.doctor_alert}`)
            : "";
          const disagree = parsed.routing && parsed.routing !== finalRouting
            ? (lang==="tr" ? `LLM yönlendirme görüşü: ${parsed.routing} → motor kararı: ${finalRouting}` : `LLM routing opinion: ${parsed.routing} → engine decision: ${finalRouting}`)
            : "";
          setRouting(finalRouting);
          setUrgency(finalRouting === engineRes.routing ? engineRes.urgency ?? null : (lang==="tr"?OFFLINE_URGENCY_TR[finalRouting]:OFFLINE_URGENCY_EN[finalRouting]));
          setSprtViz(engineRes.sprt || null);
          setDoctorAlert([engineRes.doctorAlert, disagree, advisory].filter(Boolean).join("\n\n"));
          setLambda(engineRes.lambda);
        } else {
          // Çıkarım boş — güvenlik ağı: LLM görüşü + deterministik escalation override
          finalRouting = parsed.routing;
          const topConds = [...newMatches.slice(0,3).map((m) =>(m.icd||"").toUpperCase()), ...((parsed.differentials||[]).slice(0,3).map((d) =>(d.icd||"").toUpperCase()))];
          for (const cid of ["K81","K85","E10","E27.1","K37","N20","I80.2","S06.0","T14.2","S61.9","L03.9","B02.9","L50.9"]) {
            if (topConds.includes(cid)) {
              const r = clinicalEscalation(parsed.routing, cid, dT);
              if (r !== parsed.routing) { finalRouting = r; escId = cid; break; }
            }
          }
          const escNote = escId ? escalationNote(escId, dT, lang) : "";
          setRouting(finalRouting);
          setUrgency(escId ? (lang==="tr"?OFFLINE_URGENCY_TR.RED:OFFLINE_URGENCY_EN.RED) : parsed.urgency ?? null);
          setSprtViz(null);
          setDoctorAlert(escNote ? `${escNote}\n\n${parsed.doctor_alert||""}` : parsed.doctor_alert ?? null);
          if (escId) setLambda(Math.max(9.6, parsed.lambda || 10));
        }
        setUiPhase("decision");
        setPanelTab("result");
        // If pattern engine found matches, keep them.
        // If empty (short final turn), build matches from LLM differentials so Analiz Motoru isn't blank.
        if (newMatches.length === 0 && parsed.differentials?.length) {
          setMatches(buildSyntheticMatches(parsed.differentials, parsed.routing));
        }
      }
// Belirsizlik bayrakları: motorun gerçek sonucundan türetilir (LLM tahminine değil).
      const absSource = engineRes ?? { routing: parsed.routing, diffs: parsed.differentials || [], sprt: null };
      setAbstention(deriveAbstention(absSource));
      if (parsed.phase==="collecting" && parsed.text) setFollowUpHistory((h) => { const updated=[...h]; if(updated.length>0&&updated[updated.length-1].a===""){updated[updated.length-1]={...updated[updated.length-1],a:text};} return [...updated,{q:parsed.text || "",a:""}]; });
    } catch {
      setOnlineTestError(null);
      setOfflineMode(true);
      const switchMsg = lang === "tr"
        ? "Bağlantı kurulamadı — çevrimdışı moda geçildi.\n\nAşağıdaki listeden size en çok uyan şikayeti seçin:"
        : "Could not connect — switched to offline mode.\n\nSelect the complaint that best describes what you're experiencing:";
      addMsg(switchMsg);
      setTimeout(() => startAkinator(), 100);
    }
    setLoading(false);
  }


  return { handleSymptomTurn };
}

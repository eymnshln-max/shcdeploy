import { useState } from "react";
import type {
  Abstention,
  AkinatorQuestion,
  ChatHistoryItem,
  Differential,
  DocPhase,
  ExtractedSymptoms,
  FollowUpItem,
  Lang,
  MatchResult,
  Message,
  OnlineMeta,
  PanelTab,
  PatientProfile,
  ProfileAnswers,
  RiskMods,
  Routing,
  SprtViz,
  UiPhase,
} from "../types";

const INITIAL_ONLINE_META: OnlineMeta = {
  confirmed: false,
  model: "",
  requestCount: 0,
  lastRequestId: null,
  lastDurationMs: null,
};

const INITIAL_EXTRACTED_SYMPTOMS: ExtractedSymptoms = {
  present: [],
  absent: [],
  confidence: {},
};

export function useShcSessionState() {
  const [lang, setLang] = useState<Lang | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uiPhase, setUiPhase] = useState<UiPhase>("profiling");
  const [profileAnswers, setProfileAnswers] = useState<ProfileAnswers>({});
  const [profileIdx, setProfileIdx] = useState(0);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [riskMods, setRiskMods] = useState<RiskMods>({});
  const [symptomText, setSymptomText] = useState("");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [followUpHistory, setFollowUpHistory] = useState<FollowUpItem[]>([]);
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [diffs, setDiffs] = useState<Differential[]>([]);
  const [routing, setRouting] = useState<Routing | null>(null);
  const [lambda, setLambda] = useState<number | null>(null);
  const [urgency, setUrgency] = useState<string | null>(null);
  const [doctorAlert, setDoctorAlert] = useState<string | null>(null);
  const [abstention, setAbstention] = useState<Abstention>({});
  const [panelTab, setPanelTab] = useState<PanelTab>("result");
  const [docResult, setDocResult] = useState("");
  const [docLoading, setDocLoading] = useState(false);
  const [docSummary, setDocSummary] = useState("");
  const [docPhase, setDocPhase] = useState<DocPhase>("idle");
  const [isListening, setIsListening] = useState(false);
  const [doctorMode, setDoctorMode] = useState(false);
  const [dark, setDark] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [onlineTestError, setOnlineTestError] = useState<string | null>(null);
  const [onlineMeta, setOnlineMeta] = useState<OnlineMeta>(INITIAL_ONLINE_META);
  const [extractedSymptoms, setExtractedSymptoms] = useState<ExtractedSymptoms>(INITIAL_EXTRACTED_SYMPTOMS);
  const [patientClinicalStatements, setPatientClinicalStatements] = useState<string[]>([]);
  const [akinatorAsked, setAkinatorAsked] = useState<string[]>([]);
  const [akinatorTriggers, setAkinatorTriggers] = useState<string[]>([]);
  const [akinatorCurrent, setAkinatorCurrent] = useState<AkinatorQuestion | null>(null);
  const [akinatorDone, setAkinatorDone] = useState(false);
  const [akinatorScale, setAkinatorScale] = useState(5);
  const [akinatorAnsweredNo, setAkinatorAnsweredNo] = useState<string[]>([]);
  const [akinatorAbsent, setAkinatorAbsent] = useState<string[]>([]);
  const [sprtViz, setSprtViz] = useState<SprtViz | null>(null);
  const [akinatorGate, setAkinatorGate] = useState<string | null>(null);

  function resetSessionState() {
    setLang(null);
    setMessages([]);
    setInput("");
    setLoading(false);
    setUiPhase("profiling");
    setProfileAnswers({});
    setProfileIdx(0);
    setProfile(null);
    setRiskMods({});
    setSymptomText("");
    setMatches([]);
    setFollowUpHistory([]);
    setHistory([]);
    setDiffs([]);
    setRouting(null);
    setLambda(null);
    setUrgency(null);
    setDoctorAlert(null);
    setAbstention({});
    setPanelTab("result");
    setDocResult("");
    setDocLoading(false);
    setDocSummary("");
    setDocPhase("idle");
    setIsListening(false);
    setDoctorMode(false);
    setDark(false);
    setOfflineMode(false);
    setOnlineTestError(null);
    setOnlineMeta(INITIAL_ONLINE_META);
    setExtractedSymptoms(INITIAL_EXTRACTED_SYMPTOMS);
    setPatientClinicalStatements([]);
    setAkinatorAsked([]);
    setAkinatorTriggers([]);
    setAkinatorCurrent(null);
    setAkinatorDone(false);
    setAkinatorScale(5);
    setAkinatorAnsweredNo([]);
    setAkinatorAbsent([]);
    setSprtViz(null);
    setAkinatorGate(null);
  }

  return {
    lang, setLang,
    messages, setMessages,
    input, setInput,
    loading, setLoading,
    uiPhase, setUiPhase,
    profileAnswers, setProfileAnswers,
    profileIdx, setProfileIdx,
    profile, setProfile,
    riskMods, setRiskMods,
    symptomText, setSymptomText,
    matches, setMatches,
    followUpHistory, setFollowUpHistory,
    history, setHistory,
    diffs, setDiffs,
    routing, setRouting,
    lambda, setLambda,
    urgency, setUrgency,
    doctorAlert, setDoctorAlert,
    abstention, setAbstention,
    panelTab, setPanelTab,
    docResult, setDocResult,
    docLoading, setDocLoading,
    docSummary, setDocSummary,
    docPhase, setDocPhase,
    isListening, setIsListening,
    doctorMode, setDoctorMode,
    dark, setDark,
    offlineMode, setOfflineMode,
    onlineTestError, setOnlineTestError,
    onlineMeta, setOnlineMeta,
    extractedSymptoms, setExtractedSymptoms,
    patientClinicalStatements, setPatientClinicalStatements,
    akinatorAsked, setAkinatorAsked,
    akinatorTriggers, setAkinatorTriggers,
    akinatorCurrent, setAkinatorCurrent,
    akinatorDone, setAkinatorDone,
    akinatorScale, setAkinatorScale,
    akinatorAnsweredNo, setAkinatorAnsweredNo,
    akinatorAbsent, setAkinatorAbsent,
    sprtViz, setSprtViz,
    akinatorGate, setAkinatorGate,
    resetSessionState,
  };
}

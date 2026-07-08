import { useRef, type KeyboardEvent } from "react";
import { T } from "./ui/translations";
import { useShcSessionState } from "./state/useShcSessionState";
import { useAppTheme } from "./hooks/useAppTheme";
import { useAutoScroll } from "./hooks/useAutoScroll";
import { useManualTestSnapshot } from "./hooks/useManualTestSnapshot";
import { useSpeechInput } from "./hooks/useSpeechInput";
import { useOnlineBridge } from "./hooks/useOnlineBridge";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { AppHeader } from "./components/AppHeader";
import { ChatWorkspace } from "./components/ChatWorkspace";
import { DoctorPanel } from "./components/DoctorPanel";
import { GlobalStyles } from "./components/GlobalStyles";
import { ManualTestOverlay } from "./components/ManualTestOverlay";
import { APP_FONT_STACK, getAppColors } from "./ui/theme";
import { exportClinicalReportPDF } from "./reports/clinicalReport";
import { useOfflineAssessment } from "./features/offline-assessment/useOfflineAssessment";
import { useOnlineAssessment } from "./features/online-assessment/useOnlineAssessment";
import { useProfileFlow } from "./features/profiling/useProfileFlow";
import { useDocumentAnalysis } from "./features/document-analysis/useDocumentAnalysis";
import type { Lang, MessageRole } from "./types";

const MANUAL_TEST_MODE = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("test") === "1";
const SHOW_MANUAL_TEST_UI = MANUAL_TEST_MODE && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("testPanel") === "1";
const TEST_SNAPSHOT_KEY = "standard-health:test-snapshot:v1";




export default function App() {
  const {
    lang,
    setLang,
    messages,
    setMessages,
    input,
    setInput,
    loading,
    setLoading,
    uiPhase,
    setUiPhase,
    profileAnswers,
    setProfileAnswers,
    profileIdx,
    setProfileIdx,
    profile,
    setProfile,
    riskMods,
    setRiskMods,
    symptomText,
    setSymptomText,
    matches,
    setMatches,
    followUpHistory,
    setFollowUpHistory,
    history,
    setHistory,
    diffs,
    setDiffs,
    routing,
    setRouting,
    lambda,
    setLambda,
    urgency,
    setUrgency,
    doctorAlert,
    setDoctorAlert,
    abstention,
    setAbstention,
    panelTab,
    setPanelTab,
    setDocResult,
    setDocLoading,
    docSummary,
    setDocSummary,
    docPhase,
    setDocPhase,
    isListening,
    setIsListening,
    doctorMode,
    setDoctorMode,
    dark,
    setDark,
    offlineMode,
    setOfflineMode,
    onlineTestError,
    setOnlineTestError,
    onlineMeta,
    setOnlineMeta,
    extractedSymptoms,
    setExtractedSymptoms,
    patientClinicalStatements,
    setPatientClinicalStatements,
    akinatorAsked,
    setAkinatorAsked,
    akinatorTriggers,
    setAkinatorTriggers,
    akinatorCurrent,
    setAkinatorCurrent,
    akinatorDone,
    setAkinatorDone,
    akinatorScale,
    setAkinatorScale,
    akinatorAnsweredNo,
    setAkinatorAnsweredNo,
    akinatorAbsent,
    setAkinatorAbsent,
    sprtViz,
    setSprtViz,
    akinatorGate,
    setAkinatorGate,
    resetSessionState,
  } = useShcSessionState();
  const C = getAppColors(dark);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatFileRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const { speechAvailable, toggleListen } = useSpeechInput({
    lang,
    isListening,
    setIsListening,
    setInput,
    recognitionRef,
  });

  useAutoScroll({
    enabled: !!lang,
    scrollRef,
    messages,
    loading,
    akinatorCurrent,
    akinatorGate,
    akinatorDone,
    routing,
    profileIdx,
    uiPhase,
    followUpCount: followUpHistory.length,
  });
  useAppTheme(dark);
  useManualTestSnapshot({
    enabled: MANUAL_TEST_MODE,
    snapshotKey: TEST_SNAPSHOT_KEY,
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
  });

  function addMsg(text: string, role: MessageRole = "shc") { setMessages(m => [...m, {role, text, ts:Date.now()}]); }

  function doReset() {
    resetSessionState();
    try { localStorage.removeItem(TEST_SNAPSHOT_KEY); } catch {}
  }

  function startSession(selectedLang: Lang, isOffline=false) {
    setLang(selectedLang);
    setOfflineMode(isOffline);
    setUiPhase("profiling");
    const t = T[selectedLang];
    setTimeout(() => { addMsg(t.profileIntro.trim() + "\n\n" + t.questions[0].q); }, 100);
  }

  const { callAPI } = useOnlineBridge({
    setOnlineTestError,
    setOnlineMeta,
  });

  const { handleDocumentText, handleFileUpload } = useDocumentAnalysis({
    lang,
    profile,
    uiPhase,
    addMsg,
    callAPI,
    manualTestMode: MANUAL_TEST_MODE,
    setOnlineTestError,
    setLoading,
    setDocPhase,
    setUiPhase,
    setDocSummary,
    setDocResult,
    setDocLoading,
  });

  const { startAkinator, handleGateSelect, handleAkinatorAnswer } = useOfflineAssessment({
    lang,
    riskMods,
    addMsg,
    akinatorCurrent,
    akinatorAsked,
    akinatorTriggers,
    akinatorAnsweredNo,
    akinatorAbsent,
    akinatorScale,
    akinatorGate,
    setAkinatorAsked,
    setAkinatorTriggers,
    setAkinatorAnsweredNo,
    setAkinatorAbsent,
    setAkinatorGate,
    setAkinatorDone,
    setAkinatorScale,
    setAkinatorCurrent,
    setRouting,
    setLambda,
    setDiffs,
    setSprtViz,
    setDoctorAlert,
    setAbstention,
    setUrgency,
    setUiPhase,
    setPanelTab,
  });

  const { handleSymptomTurn } = useOnlineAssessment({
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
    manualTestMode: MANUAL_TEST_MODE,
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
  });

  const { handleProfileAnswer } = useProfileFlow({
    T,
    lang,
    profileIdx,
    profileAnswers,
    offlineMode,
    addMsg,
    onSymptomTurn: handleSymptomTurn,
    setProfileAnswers,
    setProfileIdx,
    setProfile,
    setRiskMods,
    setDocPhase,
    setUiPhase,
  });

  async function send() {
    if (!lang) return;
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    addMsg(text, "user");
    const t = T[lang];
    const isProfilingDone = profileIdx >= t.questions.length;
    if (uiPhase === "profiling" && !isProfilingDone) { await handleProfileAnswer(text); return; }
    if (uiPhase === "doc_upload") { await handleDocumentText(text); return; }
    await handleSymptomTurn(text);
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); } }

  if (!lang) return <OnboardingScreen onStart={startSession} dark={dark} setDark={setDark}/>;

  const t = T[lang];
  const exportPDF = () => exportClinicalReportPDF({
    lang,
    routing,
    profile,
    diffs,
    matches,
    history,
    docSummary,
    doctorAlert,
    urgency,
    lambda,
    routingLabel: routing ? t.routing[routing] : null,
    offlineMode,
  });

  const SF = APP_FONT_STACK;

  return (
    <div className="app-shell" style={{display:"flex",flexDirection:"column",height:"100dvh",background:C.bg,fontFamily:SF,overflow:"hidden",fontSize:13,color:C.text,WebkitFontSmoothing:"antialiased"}}>

      <AppHeader
        C={C}
        SF={SF}
        dark={dark}
        setDark={setDark}
        manualTestMode={SHOW_MANUAL_TEST_UI}
        onlineTestError={onlineTestError}
        onlineMeta={onlineMeta}
        doctorMode={doctorMode}
        setDoctorMode={setDoctorMode}
        lang={lang}
        onReset={doReset}
      />

      <div className="app-main" style={{flex:1,display:"flex",overflow:"hidden"}}>

        <ChatWorkspace
          C={C}
          SF={SF}
          dark={dark}
          lang={lang}
          t={t}
          doctorMode={doctorMode}
          offlineMode={offlineMode}
          uiPhase={uiPhase}
          loading={loading}
          messages={messages}
          scrollRef={scrollRef}
          bottomRef={bottomRef}
          textareaRef={textareaRef}
          chatFileRef={chatFileRef}
          input={input}
          setInput={setInput}
          profileIdx={profileIdx}
          addMsg={addMsg}
          handleProfileAnswer={handleProfileAnswer}
          akinatorGate={akinatorGate}
          akinatorDone={akinatorDone}
          akinatorCurrent={akinatorCurrent}
          akinatorScale={akinatorScale}
          setAkinatorScale={setAkinatorScale}
          handleGateSelect={handleGateSelect}
          handleAkinatorAnswer={handleAkinatorAnswer}
          followUpHistory={followUpHistory}
          handleFileUpload={handleFileUpload}
          handleKey={handleKey}
          send={send}
          speechAvailable={speechAvailable}
          toggleListen={toggleListen}
          isListening={isListening}
        />

        <DoctorPanel
          doctorMode={doctorMode}
          C={C}
          SF={SF}
          dark={dark}
          lang={lang}
          t={t}
          offlineMode={offlineMode}
          panelTab={panelTab}
          setPanelTab={setPanelTab}
          profile={profile}
          routing={routing}
          lambda={lambda}
          diffs={diffs}
          matches={matches}
          doctorAlert={doctorAlert}
          abstention={abstention}
          sprtViz={sprtViz}
          symptomText={symptomText}
          exportPDF={exportPDF}
        />

      </div>

      <ManualTestOverlay visible={SHOW_MANUAL_TEST_UI} onlineTestError={onlineTestError} />

      <GlobalStyles C={C} />
    </div>
  );
}

import { computeOfflineResult, pickNextQuestion } from "../../clinical/offlineEngine";
import { AKINATOR_GATES } from "../../clinical/questions";
import { deriveAbstention } from "../../clinical/triage";
import { T } from "../../ui/translations";
import type {
  Abstention,
  AkinatorQuestion,
  ClinicalEngineResult,
  Differential,
  Lang,
  MessageRole,
  PanelTab,
  RiskMods,
  Routing,
  SprtViz,
  StateSetter,
  UiPhase,
} from "../../types";

interface UseOfflineAssessmentArgs {
  lang: Lang | null;
  riskMods: RiskMods;
  addMsg: (text: string, role?: MessageRole) => void;
  akinatorCurrent: AkinatorQuestion | null;
  akinatorAsked: string[];
  akinatorTriggers: string[];
  akinatorAnsweredNo: string[];
  akinatorAbsent: string[];
  akinatorScale: number;
  akinatorGate: string | null;
  setAkinatorAsked: StateSetter<string[]>;
  setAkinatorTriggers: StateSetter<string[]>;
  setAkinatorAnsweredNo: StateSetter<string[]>;
  setAkinatorAbsent: StateSetter<string[]>;
  setAkinatorGate: StateSetter<string | null>;
  setAkinatorDone: StateSetter<boolean>;
  setAkinatorScale: StateSetter<number>;
  setAkinatorCurrent: StateSetter<AkinatorQuestion | null>;
  setRouting: StateSetter<Routing | null>;
  setLambda: StateSetter<number | null>;
  setDiffs: StateSetter<Differential[]>;
  setSprtViz: StateSetter<SprtViz | null>;
  setDoctorAlert: StateSetter<string | null>;
  setAbstention: StateSetter<Abstention>;
  setUrgency: StateSetter<string | null>;
  setUiPhase: StateSetter<UiPhase>;
  setPanelTab: StateSetter<PanelTab>;
}

export function useOfflineAssessment({
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
}: UseOfflineAssessmentArgs) {
  function startAkinator() {
    setAkinatorAsked([]);
    setAkinatorTriggers([]);
    
    setAkinatorAnsweredNo([]);
    setAkinatorAbsent([]);
    setAkinatorGate(null);
    setAkinatorDone(false);
    setAkinatorScale(5);
    setAkinatorCurrent(null);
  }

  function handleGateSelect(gateId: string) {
    if (!lang) return;
    const gates = (AKINATOR_GATES as Record<Lang, { id: string; label: string }[]>)[lang] || AKINATOR_GATES.tr;
    const gate = gates.find((g) => g.id === gateId);
    if (!gate) return;
    setAkinatorGate(gateId);
    addMsg(gate.label, "user");
    const firstQ = pickNextQuestion([], gateId, [], riskMods, [], []);
    if (firstQ) {
      setAkinatorCurrent(firstQ);
      setTimeout(() => addMsg((lang==="tr" ? firstQ.text_tr : firstQ.text_en) || firstQ.text || ""), 250);
    }
  }

  function handleAkinatorAnswer(answer: "yes" | "no" | "unsure" | "scale", scaleVal?: number) {
    if (!akinatorCurrent || !lang) return;
    const q = akinatorCurrent;
    const newAsked = [...akinatorAsked, q.id];
    let newTriggers = [...akinatorTriggers];
    let newAnsweredNo  = [...akinatorAnsweredNo];
    let newAbsent = [...akinatorAbsent];

    if (q.type === "yn") {
      if (answer === "yes") {
        newTriggers = [...newTriggers, ...(q.triggers_yes||[])];
      } else {
        newAnsweredNo = [...newAnsweredNo, q.id];
        // Negatif kanıt: yalnızca açık "hayır" yokluk sayılır; "emin değilim" nötrdür
        if (answer === "no") newAbsent = [...newAbsent, ...(q.triggers_yes || [])];
      }
    } else if (q.type === "scale") {
      const val = scaleVal ?? akinatorScale;
      if (val >= 7) newTriggers = [...newTriggers, ...(q.scale_high_triggers||[])];
      if (val >= 4 && q.scale_trigger) newTriggers = [...newTriggers, q.scale_trigger];
    }

    const labelMap: Record<string, string> = {
      yes:   lang==="tr" ? "Evet" : "Yes",
      no:    lang==="tr" ? "Hayır" : "No",
      unsure:lang==="tr" ? "Emin Değilim" : "Unsure",
    };
    const displayLabel = q.type==="scale"
      ? `${scaleVal ?? akinatorScale}/10`
      : labelMap[answer];
    addMsg(displayLabel, "user");

    setAkinatorAsked(newAsked);
    setAkinatorTriggers(newTriggers);
    setAkinatorAnsweredNo(newAnsweredNo);
    setAkinatorAbsent(newAbsent);

    const MAX_QUESTIONS = 12; // SPRT erken durdurma + negatif kanıtla 12 yeterli; limitte GREY/karar
    const result = computeOfflineResult(newTriggers, riskMods, newAsked.length, akinatorGate, lang, false, newAbsent);

    const finalize = (res: ClinicalEngineResult | null, forced=false) => {
      setAkinatorDone(true);
      setAkinatorCurrent(null);
      if (res) {
        setRouting(res.routing);
        setLambda(res.lambda);
        setDiffs(res.diffs);
        setSprtViz(res.sprt || null);
        setDoctorAlert(res.doctorAlert ?? null);
        setAbstention(deriveAbstention(res));
        setUrgency(res.urgency ?? null);
        setUiPhase("decision");
        setPanelTab("result");
        const routingLabel = T[lang].routing[res.routing];
        const prefix = forced
          ? (lang==="tr" ? `Tüm sorular tamamlandı.` : `Assessment complete.`)
          : (lang==="tr" ? `Değerlendirme tamamlandı.` : `Assessment complete.`);
        addMsg(`${prefix}\n\n▸ ${routingLabel.label}`);
      } else {
        addMsg(lang==="tr"
          ? "Tüm sorular tamamlandı. Bu kategoride net bir örüntü eşleşmesi bulunamadı. Lütfen bir sağlık uzmanına başvurun."
          : "All questions complete. No clear pattern match found in this category. Please consult a healthcare professional."
        );
      }
    };

    if (result) { finalize(result, false); return; }
    if (newAsked.length >= MAX_QUESTIONS) {
      finalize(computeOfflineResult(newTriggers, riskMods, 999, akinatorGate, lang, true, newAbsent), true);
      return;
    }

    const nextQ = pickNextQuestion(newAsked, akinatorGate, newTriggers, riskMods, newAnsweredNo, newAbsent);
    if (nextQ) {
      setAkinatorCurrent(nextQ);
      setAkinatorScale(5);
      setTimeout(() => addMsg((lang==="tr" ? nextQ.text_tr : nextQ.text_en) || nextQ.text || ""), 250);
    } else {
      // Bu kapının soruları bitti — zorla karar ver
      finalize(computeOfflineResult(newTriggers, riskMods, 999, akinatorGate, lang, true, newAbsent), true);
    }
  }


  return { startAkinator, handleGateSelect, handleAkinatorAnswer };
}

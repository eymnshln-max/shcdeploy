import { parseProfile, validateProfileAnswer } from "../../clinical/profile";
import { computeRiskProfile } from "../../clinical/riskProfile";
import type {
  DocPhase,
  Lang,
  MessageRole,
  PatientProfile,
  ProfileAnswers,
  RiskMods,
  StateSetter,
  TranslationPack,
  UiPhase,
} from "../../types";

interface UseProfileFlowArgs {
  T: Record<Lang, TranslationPack>;
  lang: Lang | null;
  profileIdx: number;
  profileAnswers: ProfileAnswers;
  offlineMode: boolean;
  addMsg: (text: string, role?: MessageRole) => void;
  onSymptomTurn: (text: string) => void | Promise<void>;
  setProfileAnswers: StateSetter<ProfileAnswers>;
  setProfileIdx: StateSetter<number>;
  setProfile: StateSetter<PatientProfile | null>;
  setRiskMods: StateSetter<RiskMods>;
  setDocPhase: StateSetter<DocPhase>;
  setUiPhase: StateSetter<UiPhase>;
}

export function useProfileFlow({
  T,
  lang,
  profileIdx,
  profileAnswers,
  offlineMode,
  addMsg,
  onSymptomTurn,
  setProfileAnswers,
  setProfileIdx,
  setProfile,
  setRiskMods,
  setDocPhase,
  setUiPhase,
}: UseProfileFlowArgs) {
  async function handleProfileAnswer(text: string) {
    if (!lang) return;
    const t = T[lang];
    const q = t.questions[profileIdx];
    if (!q) { await onSymptomTurn(text); return; }
    const validation = validateProfileAnswer(q.key, q.type, text, t.validation);
    if (!validation.ok) { setTimeout(() => addMsg(`${validation.hint}\n\n${q.q}`), 150); return; }
    const newAnswers = {...profileAnswers, [q.key]: text};
    setProfileAnswers(newAnswers);
    const nextIdx = profileIdx + 1;
    setProfileIdx(nextIdx);
    if (nextIdx < t.questions.length) {
      setTimeout(() => addMsg(t.questions[nextIdx].q), 200);
    } else {
      const p = parseProfile(newAnswers);
      setProfile(p);
      const {mods} = computeRiskProfile({age:p.age,sex:p.sex,bmi:p.bmi,smoking:p.smoking,diabetes:p.diabetes,hypertension:p.hypertension,familyHistory:p.familyHistory});
      setRiskMods(mods);
      if (!offlineMode) {
        // Online modda önce belge sorusu
        setDocPhase("asking");
        const docQ = lang==="tr"
          ? `Teşekkürler, bilgilerinizi aldım.\n\nDevam etmeden önce: Mevcut bir tıbbi belgeniz var mı? (Kan tahlili, MR/BT raporu, epikriz, muayene notu vb.)\n\nVarsa aşağıdaki alana yapıştırabilirsiniz. Yoksa "yok" yazın.`
          : `Got it, thank you.\n\nBefore we continue: do you have any medical documents on hand? (Blood work, MRI/CT report, discharge summary, clinic note, etc.)\n\nIf so, paste it below. If not, just type "none".`;
        setTimeout(() => { addMsg(docQ); setUiPhase("doc_upload"); }, 200);
      } else {
        setTimeout(() => {
          addMsg(t.profileComplete(offlineMode));
          setUiPhase("symptoms");
        }, 200);
      }
    }
  }


  return { handleProfileAnswer };
}

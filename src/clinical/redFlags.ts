import { OFFLINE_PATTERN_NAMES_TR, OFFLINE_URGENCY_EN, OFFLINE_URGENCY_TR, PATTERNS } from "./patterns";
import type { ClinicalEngineResult, PatternMap, Lang, Routing } from "../types";

export const RED_FLAG_RULES = [
  // ACS — göğüs ağrısı + kol/çene/terleme/nefes'ten biri yeterli
  { triggers:["chest_pain","chest_pressure","chest_tightness"],     min_main:1,
    alarm:["left_arm_pain","jaw_pain","diaphoresis","cold_sweat","shortness_of_breath","shoulder_pain"],
    min_alarm:1, pattern:"acs",
    label_tr:"Göğüs ağrısı + eşlik eden belirti — ACS ekarte edilmeli",
    label_en:"Chest pain + accompanying symptom — ACS must be ruled out" },
  // İnme — FAST belirtilerinden 2'si
  { triggers:["facial_drooping","arm_weakness","speech_difficulty","sudden_headache","numbness_one_side"],
    min_main:2, alarm:[], min_alarm:0, pattern:"stroke",
    label_tr:"İnme belirtileri — FAST pozitif",
    label_en:"Stroke signs — FAST positive" },
  // Cauda equina — eyer uyuşması + mesane
  { triggers:["saddle_anesthesia","urinary_retention","bladder_dysfunction","bowel_dysfunction"],
    min_main:2, alarm:[], min_alarm:0, pattern:"cauda_equina",
    label_tr:"Cauda equina — acil cerrahi değerlendirme",
    label_en:"Cauda equina — emergency surgical assessment" },
  // Aort diseksiyonu — yırtılır gibi ağrı + sırt
  { triggers:["tearing_pain","sudden_severe_chest_pain"],
    min_main:1, alarm:["back_pain","pain_radiation_back"],
    min_alarm:1, pattern:"aortic_dissection",
    label_tr:"Yırtılır gibi göğüs/sırt ağrısı — aort diseksiyonu ekarte edilmeli",
    label_en:"Tearing chest/back pain — aortic dissection must be ruled out" },
  // Piyelonefrit + sepsis belirtisi
  { triggers:["fever","flank_pain"],
    min_main:2, alarm:["confusion","rapid_breathing","rapid_heart_rate"],
    min_alarm:1, pattern:"sepsis",
    label_tr:"Ateş + yan ağrısı + sistemik belirti — sepsis riski",
    label_en:"Fever + flank pain + systemic signs — sepsis risk" },
  // Ateş + nefes darlığı + sistemik → Pnömoni/Sepsis
  { triggers:["fever","shortness_of_breath"],
    min_main:2, alarm:["confusion","rigors","chest_pain"],
    min_alarm:2, pattern:"pneumonia",
    label_tr:"Ateş + nefes darlığı + sistemik belirti — acil değerlendirme",
    label_en:"Fever + breathlessness + systemic signs — emergency assessment" },
  // Travma sonrası bilinç kaybı / nöbet — tek başına yeterli
  { triggers:["loss_of_consciousness","seizure_after_injury"],
    min_main:1, alarm:[], min_alarm:0, pattern:"head_injury",
    label_tr:"Travma sonrası bilinç kaybı / nöbet — acil görüntüleme",
    label_en:"Post-injury loss of consciousness / seizure — emergent imaging" },
  // Anafilaksi — hava yolu belirtisi + alerjik bağlam
  { triggers:["throat_tightness","lip_face_swelling"],
    min_main:1, alarm:["hives","itchy_welts","rash_after_exposure","shortness_of_breath","dizziness","breathing_difficulty_allergy"],
    min_alarm:1, pattern:"urticaria_allergy",
    label_tr:"Alerjik reaksiyonda hava yolu tutulumu — anafilaksi yolu",
    label_en:"Airway involvement in allergic reaction — anaphylaxis pathway" },
  // Ani görme kaybı / perde — aynı gün retina
  { triggers:["curtain_vision","sudden_vision_loss","painless_vision_loss"],
    min_main:1, alarm:["flashes_of_light","sudden_floaters","eye_pain","headache","red_eye","blurred_vision"],
    min_alarm:1, pattern:"retinal_detachment",
    label_tr:"Ani görme kaybı / perde inmesi — aynı gün retina değerlendirmesi",
    label_en:"Sudden vision loss / curtain — same-day retina evaluation" },
];

export function checkRedFlags(collectedTriggers: string[], lang: Lang): ClinicalEngineResult | null {
  for (const rule of RED_FLAG_RULES) {
    const mainHits = rule.triggers.filter(t => collectedTriggers.includes(t)).length;
    const alarmHits = rule.alarm.filter(t => collectedTriggers.includes(t)).length;
    const mainOk = mainHits >= rule.min_main;
    const alarmOk = rule.min_alarm === 0 || alarmHits >= rule.min_alarm;
    if (mainOk && alarmOk) {
      const p = (PATTERNS as PatternMap)[rule.pattern];
      return {
        routing: "RED",
        lambda: 15,
        pattern: rule.pattern,
        label: lang === "tr" ? rule.label_tr : rule.label_en,
        diffs: [{
          name: lang==="tr" ? ((OFFLINE_PATTERN_NAMES_TR as Record<string, string>)[rule.pattern]||p?.name||rule.pattern) : (p?.name||rule.pattern),
          pct: 85, risk: "critical", source: p?.source||""
        }],
        doctorAlert: p?.doctor_alert || "",
        urgency: lang==="tr" ? OFFLINE_URGENCY_TR["RED"] : OFFLINE_URGENCY_EN["RED"],
      };
    }
  }
  return null;
}

// Offline karar motoru
// ── DETERMINISTIC CLINICAL SAFETY ESCALATION ──
// Hard override: specific red-flag features push YELLOW→RED regardless of score or LLM output.
// These are life-threatening presentations a kiosk cannot rule out, so the system over-triages by design (false-negative-first).
export function clinicalEscalation(routing: Routing, conditionId: string, triggers: string[]): Routing {
  if (routing === "RED") return routing;
  const id = (conditionId || "").toLowerCase();
  const has = (t: string) => triggers.includes(t);
  const anyOf = (...ts: string[]) => ts.some(has);
  const sirs = anyOf("fever","tachycardia","racing_heart","rapid_heartbeat","shortness_of_breath","rapid_breathing","low_blood_pressure");
  // Cholecystitis + jaundice/pale stool → possible biliary obstruction / ascending cholangitis (Charcot triad). Emergency.
  if ((id === "cholecystitis" || id === "k81") && anyOf("jaundice","clay_stool")) return "RED";
  // Acute pancreatitis + any systemic inflammatory sign (SIRS proxy) → risk of severe AP. Emergency.
  if ((id === "pancreatitis" || id === "k85") && sirs) return "RED";
  // Type 1 diabetes + DKA picture (ketotic breath, or vomiting with rapid onset / abdominal pain) → diabetic ketoacidosis. Emergency.
  if ((id === "diabetes_t1" || id === "e10") && (has("fruity_breath") || (has("vomiting") && anyOf("rapid_onset","abdominal_pain")))) return "RED";
  // Adrenal insufficiency / Addison's + hypotension or vomiting+dizziness → adrenal crisis (shock). Emergency.
  if ((id === "addisons" || id === "e27.1") && (has("low_blood_pressure") || (has("vomiting") && has("dizziness")))) return "RED";
  // Appendicitis + rebound tenderness (peritoneal sign) → perforation/peritonitis. Surgical emergency.
  if ((id === "appendicitis" || id === "k37") && has("rebound_tenderness")) return "RED";
  // Kidney stone + fever → infected obstructed stone / urosepsis. Emergency.
  if ((id === "kidney_stones" || id === "n20") && has("fever")) return "RED";
  // DVT + breathlessness/chest pain/hemoptysis → pulmonary embolism. Emergency.
  if ((id === "dvt" || id === "i80.2") && anyOf("shortness_of_breath","chest_pain","coughing_blood","rapid_breathing")) return "RED";
  // ── Travma / cilt / göz eskalasyonları ──
  if ((id === "head_injury" || id === "s06.0") && anyOf("loss_of_consciousness","repeated_vomiting","seizure_after_injury")) return "RED";
  if ((id === "fracture_suspect" || id === "t14.2") && anyOf("open_wound","limb_numb_pale")) return "RED";
  if ((id === "laceration" || id === "s61.9") && has("bleeding_uncontrolled")) return "RED";
  if ((id === "cellulitis" || id === "l03.9") && anyOf("fever","red_streaks")) return "RED";
  if ((id === "shingles" || id === "b02.9") && has("rash_near_eye")) return "RED";
  if ((id === "urticaria_allergy" || id === "l50.9") && anyOf("throat_tightness","lip_face_swelling","breathing_difficulty_allergy")) return "RED";
  return routing;
}
export function escalationNote(conditionId: string, triggers: string[], lang: Lang) {
  const id = (conditionId || "").toLowerCase();
  const has = (t: string) => triggers.includes(t);
  if ((id === "cholecystitis" || id === "k81") && (has("jaundice") || has("clay_stool")))
    return lang === "tr"
      ? "ESKALASYON: Sarılık / açık renkli dışkı = olası safra yolu tıkanıklığı veya asendan kolanjit (Charcot triadı). Acil değerlendirme; antibiyotik + acil safra drenajı gerekebilir."
      : "ESCALATION: Jaundice / pale stool = possible biliary obstruction or ascending cholangitis (Charcot triad). Emergency workup; may require antibiotics + urgent biliary drainage.";
  if (id === "pancreatitis" || id === "k85")
    return lang === "tr"
      ? "ESKALASYON: Pankreatit + sistemik enflamasyon işareti (SIRS) = ağır seyir riski. Acil servis değerlendirmesi (lipaz, IV sıvı, izlem)."
      : "ESCALATION: Pancreatitis + systemic inflammatory sign (SIRS) = risk of severe course. Emergency department evaluation (lipase, IV fluids, monitoring).";
  if (id === "diabetes_t1" || id === "e10")
    return lang === "tr"
      ? "ESKALASYON: Tip 1 diyabet + DKA bulguları (asetonlu/meyveli nefes ya da kusma + ani başlangıç). Diyabetik ketoasidoz hayati acildir. Acil glukoz + keton + IV sıvı."
      : "ESCALATION: Type 1 diabetes + DKA features (fruity/acetone breath or vomiting + rapid onset). Diabetic ketoacidosis is life-threatening. Urgent glucose + ketones + IV fluids.";
  if (id === "addisons" || id === "e27.1")
    return lang === "tr"
      ? "ESKALASYON: Adrenal yetmezlik + kriz bulguları (düşük tansiyon ya da kusma + baş dönmesi). Adrenal kriz = şok. Acil IV hidrokortizon + sıvı."
      : "ESCALATION: Adrenal insufficiency + crisis signs (low blood pressure or vomiting + dizziness). Adrenal crisis = shock. Emergency IV hydrocortisone + fluids.";
  if (id === "appendicitis" || id === "k37")
    return lang === "tr"
      ? "ESKALASYON: Apandisit + rebound (geri tepme) hassasiyeti = peritoneal bulgu, olası perforasyon/peritonit. Cerrahi acil."
      : "ESCALATION: Appendicitis + rebound tenderness = peritoneal sign, possible perforation/peritonitis. Surgical emergency.";
  if (id === "kidney_stones" || id === "n20")
    return lang === "tr"
      ? "ESKALASYON: Böbrek taşı + ateş = enfekte tıkalı taş / ürosepsis riski. Acil; tıkanıklığın acil drenajı gerekebilir."
      : "ESCALATION: Kidney stone + fever = infected obstructed stone / urosepsis risk. Emergency; obstruction may need urgent drainage.";
  if (id === "dvt" || id === "i80.2")
    return lang === "tr"
      ? "ESKALASYON: DVT + nefes darlığı / göğüs ağrısı / kan tükürme = olası pulmoner emboli. Acil."
      : "ESCALATION: DVT + breathlessness / chest pain / hemoptysis = possible pulmonary embolism. Emergency.";
  if ((id === "head_injury" || id === "s06.0") && (has("loss_of_consciousness") || has("repeated_vomiting") || has("seizure_after_injury")))
    return lang === "tr"
      ? "ESKALASYON: Travma sonrası bilinç kaybı / tekrarlayan kusma / nöbet = acil BT endikasyonu (Canadian CT Head Rule). Acil servis."
      : "ESCALATION: Post-injury LOC / repeated vomiting / seizure = emergent CT indication (Canadian CT Head Rule). ED now.";
  if ((id === "fracture_suspect" || id === "t14.2") && (has("open_wound") || has("limb_numb_pale")))
    return lang === "tr"
      ? "ESKALASYON: Kırık bölgesinde açık yara veya uyuşuk/soluk uzuv = açık kırık / nörovasküler tehlike. Acil cerrahi değerlendirme."
      : "ESCALATION: Open wound over fracture or numb/pale limb = open fracture / neurovascular compromise. Emergent surgical evaluation.";
  if ((id === "laceration" || id === "s61.9") && has("bleeding_uncontrolled"))
    return lang === "tr"
      ? "ESKALASYON: Basınca rağmen durmayan kanama = acil kanama kontrolü gerekir."
      : "ESCALATION: Bleeding uncontrolled by direct pressure = emergent hemorrhage control.";
  if ((id === "cellulitis" || id === "l03.9") && (has("fever") || has("red_streaks")))
    return lang === "tr"
      ? "ESKALASYON: Selülit + ateş veya kırmızı çizgiler (lenfanjit) = sistemik yayılım. IV antibiyotik / acil değerlendirme."
      : "ESCALATION: Cellulitis + fever or red streaks (lymphangitis) = systemic spread. IV antibiotics / emergency evaluation.";
  if ((id === "shingles" || id === "b02.9") && has("rash_near_eye"))
    return lang === "tr"
      ? "ESKALASYON: Göz çevresinde zona (Hutchinson bulgusu) = görmeyi tehdit eden oftalmik tutulum. Acil göz hastalıkları."
      : "ESCALATION: Zoster near the eye (Hutchinson sign) = sight-threatening ophthalmic involvement. Urgent ophthalmology.";
  if ((id === "urticaria_allergy" || id === "l50.9") && (has("throat_tightness") || has("lip_face_swelling") || has("breathing_difficulty_allergy")))
    return lang === "tr"
      ? "ESKALASYON: Boğaz daralması / dudak-dil şişmesi = anafilaksi yolu. Epinefrin + acil servis."
      : "ESCALATION: Throat tightness / lip-tongue swelling = anaphylaxis pathway. Epinephrine + ED.";
  return "";
}

// ═══════════════════════════════════════════════════════════════════

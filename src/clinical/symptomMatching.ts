import { PATTERNS } from "./patterns";
import type { MatchResult, RiskMods } from "../types";

export const TR_TRIGGER_MAP: Record<string, string> = {
  "bulantı":"nausea","mide bulantısı":"nausea","kusma":"vomiting","ateş":"fever","yorgunluk":"fatigue",
  "halsizlik":"fatigue","baş ağrısı":"severe_headache","şiddetli baş ağrısı":"severe_headache",
  "ani baş ağrısı":"sudden_headache","baş dönmesi":"dizziness","sersemlik":"dizziness","zonklayan baş ağrısı":"throbbing_headache",
  "titreme":"tremor","terleme":"sweating","gece terlemesi":"night_sweats","üşüme":"chills","titiz titreme":"rigors",
  "çarpıntı":"palpitations","kalp çarpıntısı":"palpitations","kalp atışı hızlı":"racing_heart","düzensiz kalp":"irregular_heartbeat",
  "nefes darlığı":"shortness_of_breath","nefes alamıyorum":"shortness_of_breath","nefes almakta güçlük":"breathlessness",
  "ani nefes darlığı":"sudden_breathlessness","egzersizde nefes darlığı":"exercise_triggered",
  "bacak şişliği":"leg_swelling","ayak şişliği":"leg_swelling","tek bacak şişliği":"leg_swelling_one_sided",
  "topuk şişliği":"ankle_swelling","göğüs ağrısı":"chest_pain","göğüste sıkışma":"chest_tightness",
  "göğüste baskı":"chest_pressure","sol kol ağrısı":"left_arm_pain","çene ağrısı":"jaw_pain","omuz ağrısı":"shoulder_pain",
  "sırt ağrısı":"back_pain","bel ağrısı":"lower_back_pain","boyun ağrısı":"neck_pain",
  "karın ağrısı":"abdominal_pain","karın ağrısı sağ alt":"right_lower_pain","sağ alt karın ağrısı":"right_lower_pain",
  "kasık ağrısı":"pelvic_pain","pelvik ağrı":"pelvic_pain","kasık":"pelvic_pain",
  "kilo kaybı":"weight_loss","kilo veriyorum":"weight_loss","açıklanamaz kilo kaybı":"unexplained_weight_loss",
  "kilo aldım":"weight_gain","kilo alıyorum":"weight_gain","iştah kaybı":"loss_of_appetite","iştahsızlık":"loss_of_appetite",
  "susuzluk":"thirst","çok su içiyorum":"thirst","sık idrara çıkıyorum":"frequent_urination","sık tuvalet":"frequent_urination",
  "bulanık görme":"blurred_vision","görme bozukluğu":"vision_change","ani görme kaybı":"sudden_vision_loss",
  "bir gözde görme kaybı":"vision_loss_one_eye","çift görme":"double_vision","ışık hassasiyeti":"light_sensitivity",
  "fotofobiyi":"photophobia","gözde ağrı":"eye_pain","gözde kızarıklık":"red_eye","halo görme":"halos_around_lights",
  "göz fışkırması":"eye_bulging","gözler dışarı çıkıyor":"eye_bulging",
  "boyun tutulması":"neck_stiffness","boyun sertliği":"neck_stiffness","ense sertliği":"neck_stiffness",
  "yüz felci":"facial_drooping","yüzde sarkma":"facial_drooping","ağız eğriliği":"facial_drooping",
  "kol güçsüzlüğü":"arm_weakness","konuşma güçlüğü":"speech_difficulty","slur konuşma":"speech_difficulty",
  "uyuşma":"numbness_one_side","hissizlik":"numbness_one_side","karıncalanma":"tingling","ayaklarda karıncalanma":"numbness_feet",
  "ani baş dönmesi":"dizziness_sudden","denge kaybı":"loss_of_balance","dengeyi kaybediyorum":"balance_problems",
  "nöbet":"seizure","sara nöbeti":"seizure","konvülsiyon":"convulsion","bilinç kaybı":"loss_of_consciousness",
  "boş bakma":"blank_staring","kasılma":"jerking_movements","dil ısırma":"tongue_biting","idrar kaçırma nöbet":"urinary_incontinence",
  "koku alamıyorum":"loss_of_smell","koku kaybı":"loss_of_smell","tat alamıyorum":"loss_of_taste",
  "hafıza problemi":"memory_problems","unutkanlık":"memory_problems","konsantrasyon güçlüğü":"concentration_problems",
  "yavaş hareket":"slow_movement","hareketlerim yavaşladı":"slow_movement","kas sertliği":"stiffness",
  "sürüklenerek yürüme":"shuffling_gait","küçük adımlarla yürüme":"shuffling_gait",
  "eklem ağrısı":"joint_pain","eklem şişliği":"joint_swelling","eklem kızarıklığı":"red_swollen_joint",
  "eklem ısınması":"joint_warmth","sabah tutukluğu":"morning_stiffness","simetrik eklem ağrısı":"symmetric_joints",
  "kavrama güçlüğü":"grip_weakness","el bileği ağrısı":"wrist_pain","küçük eklem ağrısı":"small_joint_involvement",
  "ayak başparmak ağrısı":"big_toe_pain","ani eklem ağrısı":"sudden_joint_pain","gece ağrısı":"pain_at_night",
  "kas ağrısı":"body_aches","yaygın ağrı":"widespread_pain","hassas noktalar":"tender_points",
  "kas güçsüzlüğü":"muscle_weakness","güçsüzlük":"muscle_weakness","kas krampı":"muscle_cramps",
  "bel fıtığı":"lumbar_radiculopathy","sinir sıkışması":"sciatica","bacağa vuran ağrı":"leg_pain","siyatik":"sciatica",
  "bacakta uyuşma":"numbness_leg","bacakta karıncalanma":"tingling_leg","bacak güçsüzlüğü":"weakness_leg",
  "oturuncak ağrı":"worse_sitting","at kuyruğu sendromu":"saddle_anesthesia",
  "eyer bölgesi uyuşma":"saddle_anesthesia",
  "kelebek döküntü":"butterfly_rash","yüzde döküntü":"butterfly_rash","deri döküntüsü":"skin_rash",
  "solmayan döküntü":"rash_non_blanching","kızarık cilt":"spreading_redness","cilt sıcak":"warm_skin",
  "ciltte şişlik":"skin_swelling","geniş cilt kızarıklığı":"spreading_redness","cilt ağrısı":"skin_tenderness",
  "kırmızı yama":"red_plaques","gümüş pullar":"silver_scales","kaşıntı":"itching","cilt kaşıntısı":"itching",
  "yavaş iyileşme":"slow_healing","kolay morarma":"easy_bruising","germe çizgileri":"stretch_marks",
  "mor çizgiler":"stretch_marks","yuvarlak yüz":"round_face","yağ tümseği":"hump_back","deri koyulaşması":"skin_darkening",
  "ishal":"diarrhea","kronik ishal":"chronic_diarrhea","dışkıda kan":"blood_in_stool","kanlı dışkı":"blood_in_stool","rektal kanama":"rectal_bleeding",
  "şişkinlik":"bloating","gaz şikayeti":"bloating","kabızlık":"constipation","dışkı yapamıyorum":"no_bowel_movement",
  "gaz çıkaramıyorum":"no_flatus","karın şişliği":"abdominal_distension","kolik ağrı":"colicky_pain",
  "mide yanması":"heartburn","mide ekşimesi":"acid_reflux","göğüste yanma":"chest_burning","regürjitasyon":"regurgitation",
  "yatınca kötüleşiyor":"worse_lying_down","yemekten sonra kötüleşiyor":"worse_after_eating","ekşi tat":"sour_taste",
  "mide ülseri":"burning_stomach_pain","aç karnına ağrı":"hunger_pain","epigastrik ağrı":"epigastric_pain",
  "yemekle geçiyor":"pain_relieved_by_eating","siyah dışkı":"black_stool","katran gibi dışkı":"black_stool",
  "yutma güçlüğü":"difficulty_swallowing","yutarken ağrı":"difficulty_swallowing",
  "sağ üst karın ağrısı":"right_upper_pain","yağlı yemek sonrası ağrı":"pain_after_fatty_meal",
  "sarılık":"jaundice","açık renkli dışkı":"clay_stool","sırta vuran karın ağrısı":"pain_radiates_back",
  "öne eğilince geçiyor":"better_leaning_forward","alkol geçmişi":"alcohol_history",
  "kanlı kusma":"vomiting","safra ile kusma":"vomiting_fecal","karın hassasiyeti":"abdominal_tenderness",
  "öksürük":"cough","kronik öksürük":"chronic_cough","kuru öksürük":"dry_cough","balgamlı öksürük":"sputum_production",
  "hırıltı":"wheezing","hırıltılı nefes":"wheezing","balgam":"sputum_production","fıçı göğüs":"barrel_chest",
  "sabah öksürüğü":"morning_cough","gece kötüleşiyor":"worse_at_night","allerjen tetikliyor":"allergen_triggered",
  "kan öksürme":"coughing_blood","kanlı balgam":"coughing_blood","yatarken nefes darlığı":"orthopnea",
  "yatınca nefes alamıyorum":"orthopnea","hızlı kilo alıyorum":"rapid_weight_gain",
  "boğaz ağrısı":"sore_throat","burun akması":"runny_nose","ani başlangıç":"sudden_onset",
  "köpüklü idrar":"foamy_urine","az idrar":"reduced_urine","idrarda kan":"blood_in_urine","kanlı idrar":"blood_in_urine",
  "yanmalı işeme":"burning_urination","ağrılı işeme":"painful_urination","sık tuvalet ihtiyacı":"urgency",
  "idrar bulanık":"cloudy_urine","idrar kokusu":"strong_urine_smell","alt karın ağrısı":"lower_abdominal_pain",
  "böğür ağrısı":"flank_pain","yan ağrısı":"flank_pain","şiddetli yan ağrısı":"severe_flank_pain",
  "kasığa vuran ağrı":"pain_radiates_groin",
  "kalpte hızlanma":"racing_heart","kalp hızlanması":"racing_heart","taşikardi":"tachycardia",
  "düzensiz nabız":"irregular_heartbeat","egzersiz intoleransı":"reduced_exercise",
  "düşük tansiyon":"low_blood_pressure","yüksek tansiyon":"high_blood_pressure","nabız farkı":"difference_in_arm_pulses",
  "çok ani şiddetli göğüs ağrısı":"sudden_severe_chest_pain","yırtılır gibi ağrı":"tearing_pain",
  "sırta vuran ağrı":"pain_radiation_back","soğuk terleme":"cold_sweat","bayılma hissi":"dizziness",
  "çarpıntı ve nefes darlığı":"palpitations","bacak ağrısı":"leg_pain","baldır ağrısı":"calf_pain",
  "bacak sıcaklığı":"leg_warmth","bacak kızarıklığı":"leg_redness","bacak hassasiyeti":"tenderness",
  "depresyon":"persistent_sadness","üzüntü":"persistent_sadness","mutsuzluk":"persistent_sadness",
  "ilgi kaybı":"loss_of_interest","zevk alamıyorum":"loss_of_interest","umutsuzluk":"hopelessness",
  "değersizlik hissi":"worthlessness","ağlama":"crying","sosyal çekilme":"social_withdrawal",
  "uyku değişikliği":"sleep_changes","insomnia":"insomnia","çok uyuyorum":"sleep_changes",
  "iştah değişikliği":"appetite_changes","intihar düşüncesi":"suicidal_thoughts",
  "endişe":"excessive_worry","panik":"panic_attacks","aşırı endişe":"excessive_worry","korku":"fear",
  "kas gerginliği":"muscle_tension","ani yükselen mod":"elevated_mood",
  "uyku azaldı":"decreased_sleep","grandiözite":"grandiosity","hızlı konuşma":"rapid_speech",
  "impulsivite":"impulsivity","riskli davranış":"risky_behavior","hızlı düşünceler":"racing_thoughts",
  "sinirlilik":"irritability","mod değişimi":"mood_swings","travma geçmişi":"trauma_history",
  "flashback":"flashbacks","kaçınma":"avoidance","aşırı uyanıklık":"hypervigilance","duygusal uyuşma":"emotional_numbing",
  "saç dökülmesi":"hair_loss","kuru cilt":"dry_skin","yavaş nabız":"slow_heart_rate",
  "ses kalınlaştı":"hoarse_voice","soğuğa dayanamıyorum":"cold_intolerance","sıcağa dayanamıyorum":"heat_intolerance",
  "tuz isteği":"salt_craving","akne":"acne","tüylenme fazlalığı":"excess_hair","adet düzensizliği":"irregular_periods",
  "adet gecikmesi":"missed_period","düzensiz adet":"irregular_periods","gebelenemiyorum":"difficulty_conceiving",
  "yağlı cilt":"oily_skin","şişik yüz":"puffy_face","kırılgan tırnak":"brittle_nails",
  "yüksek ateş":"high_fever","konfüzyon":"confusion","bilinç bulanıklığı":"confusion",
  "hızlı nefes":"rapid_breathing","hızlı kalp":"rapid_heart_rate","idrar yapamıyorum":"not_urinating",
  "aşırı soğukluk":"very_cold","aşırı yorgunluk":"extreme_fatigue","benekli cilt":"mottled_skin",
  "şüpheli enfeksiyon":"suspected_infection","ense tutulması":"neck_stiffness",
  "vajinal kanama":"vaginal_bleeding","gebelik testi pozitif":"positive_pregnancy_test",
  "hamile olabilirim":"missed_period",
  "horlama":"loud_snoring","gündüz uykusu":"daytime_sleepiness","sabah baş ağrısı":"morning_headache",
  "gece nefes durması":"witnessed_apnea","sık uyanma":"frequent_waking","ağız kuruluğu":"dry_mouth",
  "büyük boyun":"large_neck","soluk kesilme":"witnessed_apnea",
  "açıklanamaz yorgunluk":"persistent_fatigue","açıklanamaz kanama":"unexplained_bleeding",
  "kitle":"lump","şişlik":"lump","bağırsak değişikliği":"change_in_bowel","kemik ağrısı":"bone_pain",
  "soluk deri":"pale_skin","solgun":"pale_skin","soğuk eller":"cold_hands","çabuk yorulma":"fatigue",
  "nefes nefese kalma":"breathlessness","pika":"pica","diş eti solukluğu":"pale_gums",
  "daha önce kırık":"fracture_low_trauma","uzunluk kaybı":"height_loss","kamburlaşma":"stooped_posture",
  "stres kırığı":"fragility_fracture","kalça ağrısı":"hip_pain","omurga ağrısı":"spine_pain",
  "dizi dirsek döküntü":"elbow_knee_rash","saç derisi tutulumu":"scalp_involvement","tırnak değişimi":"nail_changes",
  "psoriazis":"red_plaques","sedef":"red_plaques","eklem ağrısı ile döküntü":"joint_pain",
  "ağız yaraları":"mouth_sores","güneş hassasiyeti":"sun_sensitivity","böbrek şikayeti":"kidney_symptoms",
  "sık enfeksiyon":"frequent_infections","cilt koyulaşması":"dark_skin_patches","mantar":"recurrent_thrush",
  "mantar tekrarlıyor":"recurrent_thrush","turuncu idrar":"blood_in_urine",
};

export const COLLOQUIAL_MAP: Record<string, string> = {
  "kalbim sıkışıyor":"chest_tightness","baskı hissediyorum":"chest_pressure",
  "nefesim kesiliyor":"shortness_of_breath","ciğerlerim yanıyor":"chest_pain",
  "başım zonkluyor":"throbbing_headache","kafam zonkluyor":"throbbing_headache",
  "gözlerim kararıyor":"dizziness","yıldızlar görüyorum":"dizziness",
  "içim bulanıyor":"nausea","midem bulanıyor":"nausea",
  "dünya dönüyor":"dizziness","ayakta duramıyorum":"balance_problems",
  "ellerim uyuşuyor":"numbness_one_side","ayaklarım uyuşuyor":"numbness_feet",
  "soluğum daralıyor":"shortness_of_breath","nefes almakta zorlanıyorum":"shortness_of_breath",
  "kalbim atlıyor":"palpitations","kalbim hızlı atıyor":"racing_heart",
  "uyuyamıyorum":"insomnia","geceleri uyanıyorum":"sleep_changes",
  "her şey tuhaf geliyor":"confusion","aklım karışıyor":"confusion",
  "kaslarım tutuldu":"muscle_weakness","kollarım tutuyor":"grip_weakness",
  "kemiklerim ağrıyor":"body_aches","tüm vücudum ağrıyor":"widespread_pain",
  "tight chest":"chest_tightness","heart racing":"racing_heart","heart pounding":"palpitations",
  "can't breathe":"shortness_of_breath","short of breath":"shortness_of_breath",
  "head spinning":"dizziness","room spinning":"dizziness","feel faint":"dizziness",
  "stomach turning":"nausea","feel sick":"nausea","throwing up":"vomiting",
  "legs giving out":"weakness_leg","hands shaking":"tremor","body shaking":"tremor",
  "everything blurry":"blurred_vision","seeing double":"double_vision",
  "can't think straight":"concentration_problems","brain fog":"memory_problems",
  "pins and needles":"tingling","numb all over":"numbness_one_side",
};

export function normalizeTR(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s")
    .replace(/ı/g,"i").replace(/ö/g,"o").replace(/ç/g,"c");
}

export function matchPatterns(st: string, riskMods: RiskMods): MatchResult[] {
  let normalized = st.toLowerCase();
  let englishSt = normalized;

  const colloquialKeys = Object.keys(COLLOQUIAL_MAP).sort((a,b)=>b.length-a.length);
  for (const phrase of colloquialKeys) {
    const normPhrase = normalizeTR(phrase);
    if (normalizeTR(normalized).includes(normPhrase)) {
      englishSt += " " + COLLOQUIAL_MAP[phrase];
    }
  }

  const sortedKeys = Object.keys(TR_TRIGGER_MAP).sort((a,b)=>b.length-a.length);
  for (const tr of sortedKeys) {
    if (normalizeTR(normalized).includes(normalizeTR(tr))) {
      englishSt += " " + TR_TRIGGER_MAP[tr];
    }
  }

  const words = englishSt.toLowerCase().split(/[\s,;.!?_]+/).filter(Boolean);

  const results = [];
  for (const [key,pat] of Object.entries(PATTERNS)) {
    const triggerHits = pat.triggers.filter(t => {
      const tParts = t.split("_");
      return words.some((w: string) =>
        tParts.some(tp =>
          tp === w ||
          (w.length > 4 && tp.length > 4 && (w === tp || w.startsWith(tp) || tp.startsWith(w)))
        )
      );
    }).length;
    const requiredMet = pat.required_any.some(r => {
      const rParts = r.split("_");
      return words.some((w: string) =>
        rParts.some(rp =>
          rp === w ||
          (w.length > 4 && rp.length > 4 && (w === rp || w.startsWith(rp) || rp.startsWith(w)))
        )
      );
    });
    const confirmatoryMet = pat.confirmatory.length > 0 && pat.confirmatory.every(c => {
      const cParts = c.split("_");
      return words.some((w: string) =>
        cParts.some(cp =>
          cp === w ||
          (w.length > 4 && cp.length > 4 && (w === cp || w.startsWith(cp) || cp.startsWith(w)))
        )
      );
    });
    if (!requiredMet || triggerHits < 2) continue;
    const profileMod = riskMods?.[key] ?? 1.0;
    const score = triggerHits * 10 + (confirmatoryMet ? 30 : 0) + Math.log(profileMod + 0.1) * 5;
    results.push({...pat, key, score, confirmatoryMet, triggerHits, profileMod});
  }
  return results.sort((a,b) => b.score - a.score).slice(0, 6);
}

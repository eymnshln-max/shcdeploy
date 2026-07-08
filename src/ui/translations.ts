import type { Lang, TranslationPack } from "../types";

export const T: Record<Lang, TranslationPack> = {
  en: {
    appSub: "Standard HealthCare",
    tabResult: "RESULT", tabDiff: "DIFF Δ", tabEngine: "ENGINE",
    patientLabel: "Patient", triageLabel: "Triage", sprtLabel: "Risk Level", qrLabel: "Show this to your doctor",
    safe: "SAFE", critical: "CRITICAL", alertLabel: "Doctor Note",
    uncertaintyLabel: "Uncertainty",
    uFlags: [{k:"boundary",label:"Risk boundary unclear"},{k:"multiple",label:"Multiple diagnoses"},{k:"unusual",label:"Unusual pattern"}],
    diffLabel: "Differential Diagnoses", diffEmpty: "—",
    engineLabel: "Pattern Engine", engineEmpty: "—",
    sourcesLabel: "Sources", awaiting: "No assessment yet",
    placeholder_symptom: "Describe your symptoms...",
    hint: 'Plain language works — "chest pain for two hours, left arm feels heavy"',
    connError: "Could not connect. Please check your internet and try again. If this is urgent, call 911 or go to the nearest ED.",
    profileComplete: (offline: boolean) => offline
      ? `Got it, thank you.\n\nSelect the complaint that best describes what you're experiencing:`
      : `Got it, thank you.\n\nNow describe your symptoms however feels natural.`,
    profileIntro: "Hi! Before we get started, I'll need a few quick details — it only takes a minute and makes the analysis much more accurate.\n\n",
    questions: [
      {key:"sex",          q:"What is your biological sex?",                                  type:"choice", choices:["Male","Female"]},
      {key:"age",          q:"How old are you?",                                              type:"number"},
      {key:"height_cm",    q:"Height in centimetres?",                                        type:"number"},
      {key:"weight_kg",    q:"Weight in kilograms?",                                          type:"number"},
      {key:"smoking",      q:"Do you currently smoke?",                                       type:"choice", choices:["Yes","No"]},
      {key:"diabetes",     q:"Have you been diagnosed with diabetes?",                        type:"choice", choices:["Yes","No"]},
      {key:"hypertension", q:"Do you have high blood pressure?",                             type:"choice", choices:["Yes","No"]},
      {key:"family_history",q:"Does close family have heart disease, diabetes or cancer?",   type:"choice", choices:["Yes","No"]},
    ],
    validation: { empty:"Please enter an answer to continue.", number:"Please enter a valid number.", age:"SHC is designed for adults (18+). For patients under 18, please consult a healthcare professional directly.", age_over:"Please enter a valid age (18–120).", height:"Please enter height in cm (e.g. 170).", weight:"Please enter weight in kg (e.g. 70).", yesno:"Please answer yes or no." },
    yesPattern: /yes|yeah|yep|evet/i,
    sexFemalePattern: /female|woman/i,
    routing: { RED:{label:"Emergency — Go Now",sub:"Call 911 or go to ED immediately"}, YELLOW:{label:"See a Doctor Today",sub:"Book urgent appointment"}, GREEN:{label:"Monitor at Home",sub:"See GP if symptoms worsen"}, GREY:{label:"See a Doctor — Unclear",sub:"Pattern unclear — doctor review needed"} },
  },
  tr: {
    appSub: "Standard HealthCare",
    tabResult: "SONUÇ", tabDiff: "AYIRT Δ", tabEngine: "MOTOR",
    patientLabel: "Hasta", triageLabel: "Triyaj", sprtLabel: "Risk Göstergesi", qrLabel: "Bunu doktorunuza gösterin",
    safe: "DÜŞÜK", critical: "KRİTİK", alertLabel: "Doktor Notu",
    uncertaintyLabel: "Belirsizlik",
    uFlags: [{k:"boundary",label:"Risk sınırı belirsiz"},{k:"multiple",label:"Birden fazla olası tanı"},{k:"unusual",label:"Alışılmadık belirti örüntüsü"}],
    diffLabel: "Olası Tanılar", diffEmpty: "—",
    engineLabel: "Analiz Motoru", engineEmpty: "—",
    sourcesLabel: "Kaynaklar", awaiting: "Henüz değerlendirme yapılmadı",
    placeholder_symptom: "Belirtilerinizi açıklayın...",
    hint: 'Sade bir dille anlatabilirsiniz — "iki saattir göğüs ağrım var, sol kolum da ağrıyor"',
    connError: "Bağlantı hatası oluştu. Acil durum ise lütfen 112'yi arayın veya en yakın acil servise gidin.",
    profileComplete: (offline: boolean) => offline
      ? `Teşekkürler, bilgilerinizi aldım.\n\nAşağıdaki listeden size en çok uyan şikayeti seçin:`
      : `Şimdi bana neden geldiğinizi anlatın. Sizi rahatsız eden ne?`,
    profileIntro: "Merhaba! Başlamadan önce birkaç hızlı soru sormam gerekiyor — bir dakika sürer ve sonuçları çok daha doğru hale getirir.\n\n",
    questions: [
      {key:"sex",          q:"Biyolojik cinsiyetiniz nedir?",                                      type:"choice", choices:["Erkek","Kadın"]},
      {key:"age",          q:"Kaç yaşındasınız?",                                                  type:"number"},
      {key:"height_cm",    q:"Boyunuz kaç cm?",                                                    type:"number"},
      {key:"weight_kg",    q:"Kilonuz kaç kg?",                                                    type:"number"},
      {key:"smoking",      q:"Şu an sigara içiyor musunuz?",                                       type:"choice", choices:["Evet","Hayır"]},
      {key:"diabetes",     q:"Diyabet tanınız var mı?",                                            type:"choice", choices:["Evet","Hayır"]},
      {key:"hypertension", q:"Yüksek tansiyon probleminiz var mı?",                               type:"choice", choices:["Evet","Hayır"]},
      {key:"family_history",q:"Yakın ailenizde kalp hastalığı, diyabet veya kanser var mı?",     type:"choice", choices:["Evet","Hayır"]},
    ],
    validation: { empty:"Devam etmek için lütfen bir cevap girin.", number:"Lütfen geçerli bir sayı girin.", age:"SHC yetişkinler (18+) için tasarlanmıştır. 18 yaş altı hastalar için lütfen doğrudan bir sağlık uzmanına başvurun.", age_over:"Lütfen geçerli bir yaş girin (18–120).", height:"Lütfen cm cinsinden boy girin (örn. 170).", weight:"Lütfen kg cinsinden kilo girin (örn. 70).", yesno:"Lütfen evet veya hayır olarak yanıtlayın." },
    yesPattern: /yes|yeah|yep|evet|^e$/i,
    sexFemalePattern: /female|woman|kadın|kadin|^k$/i,
    routing: { RED:{label:"Acil — Hemen Gidin",sub:"112'yi arayın veya acil servise gidin"}, YELLOW:{label:"Bugün Doktora Görünün",sub:"Acil randevu alın"}, GREEN:{label:"Evde İzleyin",sub:"Kötüleşirse doktora gidin"}, GREY:{label:"Doktora Danışın",sub:"Örüntü net değil — doktor değerlendirmesi gerekli"} },
  }
};

// ── AKINATOR OFFLINE ENGINE ──

// Kapı kartları — hasta hangi ana şikayetle başlıyor?

import type { Lang, PatientProfile } from "../types";

export function isNoDocumentReply(text: string): boolean {
  return /^(yok|no|none|hayır|hayir|nope|-)$/i.test(text.trim());
}

export function buildMedicalDocumentPrompt(lang: Lang, profileData: PatientProfile | null): string {
  const profileSummary = profileData
    ? [
        profileData.age && `${profileData.age}y`,
        profileData.sex,
        profileData.bmi && `BMI ${profileData.bmi.toFixed(0)}`,
        profileData.diabetes && "DM",
        profileData.hypertension && "HTN",
      ].filter(Boolean).join(", ")
    : "";

  return lang === "tr"
    ? `Sen klinik bir asistansın. Verilen belgenin tıbbi bir belge olup olmadığını önce kontrol et (kan tahlili, MR/BT raporu, epikriz, muayene notu, reçete, laboratuvar sonucu vb.). Eğer tıbbi bir belge DEĞİLSE, sadece şunu yaz: "NOT_MEDICAL". Tıbbi belgeyse doktor için özetle. Hasta: ${profileSummary}. Çıktı: önemli bulgular, anormal değerler, doktor için dikkat çekici noktalar. Maksimum 300 kelime. Sadece özet yaz.`
    : `You are a clinical assistant. First check if the document is a medical document (blood work, MRI/CT report, discharge summary, clinic note, prescription, lab result, etc.). If it is NOT a medical document, respond only with: "NOT_MEDICAL". If it is medical, summarize it for a doctor. Patient: ${profileSummary}. Output: key findings, abnormal values, clinically notable points. Max 300 words. Output summary only.`;
}

export function buildDocumentUserContent(rawText: string, pdfBase64?: string | null) {
  return pdfBase64
    ? [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
        { type: "text", text: "Check if this is a medical document and summarize as instructed." },
      ]
    : `Document:\n\n${rawText.trim()}`;
}

export function documentCopy(lang: Lang) {
  const tr = lang === "tr";
  return {
    pasteNotMedical: tr
      ? "Bu metin tıbbi bir belge gibi görünmüyor. Kan tahlili, MR raporu veya muayene notu yapıştırabilirsiniz. Devam etmek için \"yok\" yazın."
      : "This doesn't look like a medical document. You can paste a lab result, MRI report, or clinic note. Type \"none\" to continue without a document.",
    pasteAck: tr
      ? `Belgenizi aldım, özetledim ve değerlendirmeme dahil ettim.\n\nŞimdi bana neden geldiğinizi anlatın - sizi en çok ne rahatsız ediyor?`
      : `Got it - I've summarized your document and included it in my assessment.\n\nNow tell me what brought you in - what's been bothering you most?`,
    pasteFail: tr
      ? "Belgeyi işleyemedim ama devam edebiliriz.\n\nBana neden geldiğinizi anlatın."
      : "Couldn't process the document, but we can continue.\n\nTell me what's been bothering you.",
    invalidUploadType: tr
      ? "Sadece PDF veya metin dosyası yükleyebilirsiniz."
      : "Only PDF or text files are supported.",
    uploadNotMedical: tr
      ? "Bu belge tıbbi bir belge gibi görünmüyor. Lütfen kan tahlili, MR/BT raporu, epikriz veya muayene notu yükleyin."
      : "This doesn't look like a medical document. Please upload a lab result, MRI/CT report, discharge summary, or clinic note.",
    uploadAck: tr
      ? `Belgenizi okudum ve değerlendirmeme dahil ettim.\n\nDevam edelim - sizi en çok ne rahatsız ediyor?`
      : `I've read your document and included it in my assessment.\n\nLet's continue - what's been bothering you most?`,
    uploadFail: tr ? "Belge okunamadı." : "Couldn't read the document.",
  };
}

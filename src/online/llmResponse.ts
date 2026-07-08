import type { Lang, LlmParsedResponse } from "../types";

export function parseLlmJson(raw: string, lang: Lang): LlmParsedResponse {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    const jsonStr = jsonStart >= 0 && jsonEnd > jsonStart
      ? cleaned.slice(jsonStart, jsonEnd + 1)
      : cleaned;
    return JSON.parse(jsonStr) as LlmParsedResponse;
  } catch {
    return {
      text: lang === "tr"
        ? "Değerlendirme tamamlandı. Lütfen semptomlarınızı tekrar özetler misiniz?"
        : "Assessment complete. Could you summarize your symptoms once more?",
      phase: "collecting",
      differentials: [],
      routing: null,
    };
  }
}

export function getSafeDisplayText(parsed: LlmParsedResponse, lang: Lang): string {
  if (parsed.text && !parsed.text.trim().startsWith("{") && !parsed.text.trim().startsWith("[")) {
    return parsed.text;
  }

  return lang === "tr" ? "Değerlendiriyorum..." : "Processing...";
}

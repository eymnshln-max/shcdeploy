import { buildDocumentUserContent, buildMedicalDocumentPrompt, documentCopy, isNoDocumentReply } from "../../documents/medicalDocument";
import { readFileAsBase64 } from "../../utils/file";
import { T } from "../../ui/translations";
import type {
  DocPhase,
  Lang,
  MessageRole,
  OnlineResponse,
  PatientProfile,
  StateSetter,
  UiPhase,
} from "../../types";

interface UseDocumentAnalysisArgs {
  lang: Lang | null;
  profile: PatientProfile | null;
  uiPhase: UiPhase;
  addMsg: (text: string, role?: MessageRole) => void;
  callAPI: (system: string, messages: { role: "user" | "assistant"; content: unknown }[]) => Promise<OnlineResponse>;
  manualTestMode: boolean;
  setOnlineTestError: StateSetter<string | null>;
  setLoading: StateSetter<boolean>;
  setDocPhase: StateSetter<DocPhase>;
  setUiPhase: StateSetter<UiPhase>;
  setDocSummary: StateSetter<string>;
  setDocResult: StateSetter<string>;
  setDocLoading: StateSetter<boolean>;
}

export function useDocumentAnalysis({
  lang,
  profile,
  uiPhase,
  addMsg,
  callAPI,
  manualTestMode,
  setOnlineTestError,
  setLoading,
  setDocPhase,
  setUiPhase,
  setDocSummary,
  setDocResult,
  setDocLoading,
}: UseDocumentAnalysisArgs) {
  async function summarizeDoc(rawText: string, profileData: PatientProfile | null, pdfBase64: string | null = null) {
    if (!lang) return "";
    try {
      const data = await callAPI(
        buildMedicalDocumentPrompt(lang, profileData),
        [{ role: "user", content: buildDocumentUserContent(rawText, pdfBase64) }]
      );
      const result = data?.content?.map((block) => block.text || "").join("").trim() || "";
      return result === "NOT_MEDICAL" ? "NOT_MEDICAL" : result;
    } catch (err) {
      if (manualTestMode) setOnlineTestError(err instanceof Error ? err.message : String(err));
      return "";
    }
  }

  async function handleDocumentText(text: string) {
    if (!lang) return;
    const copy = documentCopy(lang);
    if (isNoDocumentReply(text)) {
      setDocPhase("done");
      setUiPhase("symptoms");
      setTimeout(() => addMsg(T[lang].profileComplete(false)), 200);
      return;
    }

    setLoading(true);
    setDocPhase("uploading");
    const summary = await summarizeDoc(text, profile);
    if (summary === "NOT_MEDICAL") {
      addMsg(copy.pasteNotMedical);
      setDocPhase("asking");
      setUiPhase("doc_upload");
    } else if (summary) {
      setDocSummary(summary);
      setDocResult(summary);
      addMsg(copy.pasteAck);
      setDocPhase("done");
      setUiPhase("symptoms");
    } else {
      addMsg(copy.pasteFail);
      setDocPhase("done");
      setUiPhase("symptoms");
    }
    setLoading(false);
  }

  async function handleFileUpload(file: File | null, source: "chat" | "panel") {
    if (!lang) return;
    if (!file) return;
    const copy = documentCopy(lang);
    const isPdf = file.type === "application/pdf";
    const isText = file.type.startsWith("text/");
    if (!isPdf && !isText) {
      if (source === "chat") addMsg(copy.invalidUploadType);
      return;
    }

    if (source === "chat") {
      addMsg(`📄 ${file.name}`, "user");
      setLoading(true);
    } else {
      setDocLoading(true);
      setDocResult("");
    }

    const summary = isPdf
      ? await summarizeDoc("", profile, await readFileAsBase64(file))
      : await summarizeDoc(await file.text(), profile);

    if (summary === "NOT_MEDICAL") {
      if (source === "chat") addMsg(copy.uploadNotMedical);
      else setDocResult(copy.uploadNotMedical);
    } else if (summary) {
      setDocSummary((prev: string) => prev ? `${prev}\n\n---\n\n${summary}` : summary);
      setDocResult(summary);
      if (source === "chat") {
        addMsg(copy.uploadAck);
        if (uiPhase === "doc_upload") {
          setDocPhase("done");
          setUiPhase("symptoms");
        }
      }
    } else {
      if (source === "chat") addMsg(copy.uploadFail);
      else setDocResult(copy.uploadFail);
    }

    setLoading(false);
    setDocLoading(false);
  }

  return { handleDocumentText, handleFileUpload, summarizeDoc };
}

import type { RefObject } from "react";
import type { Lang, StateSetter } from "../types";

interface UseSpeechInputArgs {
  lang: Lang | null;
  isListening: boolean;
  setIsListening: StateSetter<boolean>;
  setInput: StateSetter<string>;
  recognitionRef: RefObject<SpeechRecognition | null>;
}

export function useSpeechInput({ lang, isListening, setIsListening, setInput, recognitionRef }: UseSpeechInputArgs) {
  const speechAvailable = typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  function toggleListen() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === "tr" ? "tr-TR" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript || "";
      if (transcript) setInput((prev: string) => prev ? `${prev} ${transcript}` : transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  return { speechAvailable, toggleListen };
}

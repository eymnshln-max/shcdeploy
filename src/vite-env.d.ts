/// <reference types="vite/client" />

import type { OnlineBridgeData } from "./types";

declare module "*.css" {
  const content: string;
  export default content;
}

declare global {
  interface SpeechRecognition {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
    start: () => void;
    stop: () => void;
  }

  interface SpeechRecognitionConstructor {
    new (): SpeechRecognition;
  }

  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    StandardHealthOnline?: {
      complete: (payload: {
        system: string;
        messages: unknown[];
        maxTokens: number;
        temperature: number;
      }) => Promise<OnlineBridgeData>;
      assertOnline: (data: OnlineBridgeData) => void;
      state?: {
        requestCount?: number;
      };
    };
    __SHC_TEST_SNAPSHOT__?: unknown;
  }
}

export {};

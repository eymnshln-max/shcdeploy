import { useEffect, type RefObject } from "react";
import type { AkinatorQuestion, Message, Routing, UiPhase } from "../types";

interface UseAutoScrollArgs {
  enabled: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  messages: Message[];
  loading: boolean;
  akinatorCurrent: AkinatorQuestion | null;
  akinatorGate: string | null;
  akinatorDone: boolean;
  routing: Routing | null;
  profileIdx: number;
  uiPhase: UiPhase;
  followUpCount: number;
}

function resetPageScroll() {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function syncVisualViewportHeight() {
  const height = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--shc-viewport-height", `${height}px`);
}

function isShortLandscape() {
  return window.matchMedia("(orientation: landscape) and (max-height: 520px)").matches;
}

function isTextInputActive() {
  const active = document.activeElement;
  return active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement;
}

export function useAutoScroll({
  enabled,
  scrollRef,
  messages,
  loading,
  akinatorCurrent,
  akinatorGate,
  akinatorDone,
  routing,
  profileIdx,
  uiPhase,
  followUpCount,
}: UseAutoScrollArgs) {
  useEffect(() => {
    if (!enabled) return;
    const sc = scrollRef.current;
    if (!sc) return;

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        sc.scrollTo({ top: sc.scrollHeight, behavior: "smooth" });
      });
    });

    return () => cancelAnimationFrame(id);
  }, [enabled, scrollRef, messages, loading, akinatorCurrent, akinatorGate, akinatorDone, routing, profileIdx, uiPhase, followUpCount]);

  useEffect(() => {
    if (!enabled) return;
    const sc = scrollRef.current;
    if (!sc) return;

    syncVisualViewportHeight();

    const handleViewportChange = () => {
      syncVisualViewportHeight();
      resetPageScroll();
      if (isShortLandscape() || isTextInputActive()) {
        requestAnimationFrame(() => {
          sc.scrollTo({ top: sc.scrollHeight, behavior: "auto" });
        });
      }
    };

    const handleTextFocus = () => {
      syncVisualViewportHeight();
      resetPageScroll();

      for (const delay of [0, 80, 220]) {
        window.setTimeout(() => {
          syncVisualViewportHeight();
          sc.scrollTo({ top: sc.scrollHeight, behavior: "auto" });
        }, delay);
      }
    };

    window.addEventListener("orientationchange", handleViewportChange);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("focusin", handleTextFocus);
    window.visualViewport?.addEventListener("resize", handleViewportChange);

    return () => {
      document.documentElement.style.removeProperty("--shc-viewport-height");
      window.removeEventListener("orientationchange", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("focusin", handleTextFocus);
      window.visualViewport?.removeEventListener("resize", handleViewportChange);
    };
  }, [enabled, scrollRef]);
}

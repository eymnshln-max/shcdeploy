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

function isShortLandscape() {
  return window.matchMedia("(orientation: landscape) and (max-height: 520px)").matches;
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

    const handleViewportChange = () => {
      resetPageScroll();
      if (isShortLandscape()) {
        requestAnimationFrame(() => {
          sc.scrollTo({ top: sc.scrollHeight, behavior: "smooth" });
        });
      }
    };

    window.addEventListener("orientationchange", handleViewportChange);
    window.addEventListener("resize", handleViewportChange);
    window.visualViewport?.addEventListener("resize", handleViewportChange);

    return () => {
      window.removeEventListener("orientationchange", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
      window.visualViewport?.removeEventListener("resize", handleViewportChange);
    };
  }, [enabled, scrollRef]);
}

import { useEffect, type RefObject } from "react";
import type { AkinatorQuestion, Message, Routing } from "../types";

interface UseAutoScrollArgs {
  enabled: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  messages: Message[];
  loading: boolean;
  akinatorCurrent: AkinatorQuestion | null;
  akinatorGate: string | null;
  akinatorDone: boolean;
  routing: Routing | null;
}

export function useAutoScroll({ enabled, scrollRef, messages, loading, akinatorCurrent, akinatorGate, akinatorDone, routing }: UseAutoScrollArgs) {
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
  }, [enabled, scrollRef, messages, loading, akinatorCurrent, akinatorGate, akinatorDone, routing]);
}

import { completeOnlineRequest } from "../online/client";
import type { OnlineMessage, OnlineMeta, OnlineResponse, StateSetter } from "../types";

interface UseOnlineBridgeArgs {
  setOnlineTestError: StateSetter<string | null>;
  setOnlineMeta: StateSetter<OnlineMeta>;
}

export function useOnlineBridge({ setOnlineTestError, setOnlineMeta }: UseOnlineBridgeArgs) {
  async function callAPI(system: string, messages: OnlineMessage[]): Promise<OnlineResponse> {
    const { data, clientRequestCount, response } = await completeOnlineRequest({ system, messages });
    setOnlineTestError(null);
    setOnlineMeta((prev) => ({
      confirmed: true,
      model: data.model || prev.model,
      requestCount: Math.max(prev.requestCount + 1, clientRequestCount),
      lastRequestId: data.requestId || null,
      lastDurationMs: data.durationMs ?? null,
    }));
    return response;
  }

  return { callAPI };
}

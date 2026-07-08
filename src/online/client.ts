import type { OnlineBridgeData, OnlineMessage, OnlineResponse } from "../types";

interface CompleteOnlineRequestArgs {
  system: string;
  messages: OnlineMessage[];
  maxTokens?: number;
  temperature?: number;
}

export async function completeOnlineRequest({ system, messages, maxTokens = 1000, temperature = 0.2 }: CompleteOnlineRequestArgs): Promise<{ data: OnlineBridgeData; clientRequestCount: number; response: OnlineResponse }> {
  const onlineClient = window.StandardHealthOnline;
  if (!onlineClient?.complete) {
    throw new Error("Online Claude bridge is not loaded. Start the app through the local test server.");
  }

  const data = await onlineClient.complete({
    system,
    messages,
    maxTokens,
    temperature,
  });
  onlineClient.assertOnline(data);

  return {
    data,
    clientRequestCount: onlineClient.state?.requestCount || 0,
    response: {
      content: [{ type: "text", text: data.text }],
      model: data.model,
      stop_reason: data.stopReason,
      usage: data.usage,
      online: true,
      fallbackUsed: false,
    },
  };
}

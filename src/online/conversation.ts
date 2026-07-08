const MAX_HISTORY_TURNS = 12;

import type { ChatHistoryItem } from "../types";

export function trimHistory(history: ChatHistoryItem[]): ChatHistoryItem[] {
  if (history.length <= MAX_HISTORY_TURNS) return history;
  return [history[0], ...history.slice(-(MAX_HISTORY_TURNS - 1))];
}

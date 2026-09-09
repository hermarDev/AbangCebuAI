"use client";

import { useCallback, useState } from "react";
import type { Rental } from "@/contracts/preview";
import { SAMPLE_RENTALS } from "@/features/listings/preview-rentals";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  recommendations?: Rental[];
  quoteText?: string;
}

export const INITIAL_QUICK_PROMPTS = [
  "Rooms under ₱2,500",
  "Near USC Talamban / IT Park",
  "Solo room with Wi-Fi",
  "Bedspace near Colon / Downtown",
] as const;

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome-1",
    role: "assistant",
    content: "Maayong adlaw! 👋 I'm your Cebu rental companion. Tell me your budget, preferred area, or what you need — I can help you find available rooms and boarding houses nearby.",
    timestamp: "Just now",
    quoteText: "“A room around ₱2,500 near my college.”",
  },
];

export function useChatPreview(onShowOnMap?: (rentalId: string) => void) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);

  const matchRentals = useCallback((query: string): { matched: Rental[]; summary: string } => {
    const q = query.toLowerCase();
    const available = SAMPLE_RENTALS.filter((r) => r.available);

    // 1. Budget extraction
    const budgetMatch = q.match(/(\d+[\d,]*)/);
    let maxBudget: number | null = null;
    if (budgetMatch) {
      const parsed = parseInt(budgetMatch[1].replace(/,/g, ""), 10);
      if (!isNaN(parsed) && parsed > 500 && parsed < 50000) {
        maxBudget = parsed;
      }
    }

    // 2. Locality matching
    let localityFilter: string | null = null;
    if (q.includes("lahug")) localityFilter = "Lahug";
    else if (q.includes("it park") || q.includes("it-park")) localityFilter = "IT Park";
    else if (q.includes("mabolo")) localityFilter = "Mabolo";
    else if (q.includes("fuente") || q.includes("capitol")) localityFilter = "Fuente";
    else if (q.includes("mandaue")) localityFilter = "Mandaue";
    else if (q.includes("talamban") || q.includes("usc")) localityFilter = "Talamban";
    else if (q.includes("colon") || q.includes("downtown")) localityFilter = "Downtown";

    // 3. Rental type
    let typeFilter: "room" | "bedspace" | "boarding-house" | null = null;
    if (q.includes("bedspace") || q.includes("shared")) typeFilter = "bedspace";
    else if (q.includes("boarding") || q.includes("bh")) typeFilter = "boarding-house";
    else if (q.includes("private") || q.includes("solo") || q.includes("room")) typeFilter = "room";

    // 4. Wi-Fi
    const needsWifi = q.includes("wifi") || q.includes("wi-fi");

    // Filter
    let results = available.filter((r) => {
      if (maxBudget !== null && r.price > maxBudget) return false;
      if (localityFilter && !r.locality.toLowerCase().includes(localityFilter.toLowerCase()) && !r.title.toLowerCase().includes(localityFilter.toLowerCase())) {
        return false;
      }
      if (typeFilter && r.type !== typeFilter) return false;
      if (needsWifi && !r.amenities.includes("Wi-Fi")) return false;
      return true;
    });

    // Fallback if too strict
    if (results.length === 0) {
      if (maxBudget !== null) {
        results = available.filter((r) => r.price <= maxBudget);
      }
      if (results.length === 0 && localityFilter) {
        results = available.filter((r) => r.locality.toLowerCase().includes(localityFilter.toLowerCase()));
      }
      if (results.length === 0) {
        results = available.slice(0, 3);
      }
    }

    const matched = results.slice(0, 3);
    let summary = `Found ${matched.length} sample ${matched.length === 1 ? "room" : "rooms"} matching your criteria in Cebu:`;
    if (maxBudget) {
      summary = `Found ${matched.length} options within ₱${maxBudget.toLocaleString()} / month:`;
    }

    return { matched, summary };
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMsgId = `user-${Date.now()}`;
      const userMsg: ChatMessage = {
        id: userMsgId,
        role: "user",
        content: trimmed,
        timestamp: "Just now",
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      // Simulate realistic AI thought and matching latency
      setTimeout(() => {
        const { matched, summary } = matchRentals(trimmed);
        const botMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: summary,
          timestamp: "Just now",
          recommendations: matched,
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
      }, 650);
    },
    [isTyping, matchRentals]
  );

  const resetChat = useCallback(() => {
    setMessages(INITIAL_MESSAGES);
    setIsTyping(false);
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    resetChat,
    onShowOnMap,
  };
}

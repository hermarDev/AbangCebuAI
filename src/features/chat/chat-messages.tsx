"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { MapPin, Wifi, ExternalLink } from "lucide-react";
import { formatPrice } from "@/features/search/preview-search";
import type { ChatMessage } from "./use-chat-preview";
import { ChatQuickChips } from "./chat-quick-chips";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isTyping: boolean;
  onSelectPrompt: (prompt: string) => void;
  onShowOnMap?: (rentalId: string) => void;
}

export function ChatMessages({
  messages,
  isTyping,
  onSelectPrompt,
  onShowOnMap,
}: ChatMessagesProps) {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="chat-messages-container" role="log" aria-live="polite" aria-label="Conversation messages">
      {messages.map((msg, index) => {
        const isAssistant = msg.role === "assistant";
        const isFirstWelcome = isAssistant && index === 0;

        return (
          <div
            key={msg.id}
            className={`chat-message-row ${isAssistant ? "is-assistant" : "is-user"}`}
          >
            {isAssistant && (
              <div className="chat-msg-avatar" aria-hidden="true">
                <Image
                  src="/icons/chatbot_logo.png"
                  alt=""
                  width={28}
                  height={28}
                  className="chat-avatar-img"
                />
              </div>
            )}

            <div className="chat-bubble-wrap">
              <div className="chat-bubble">
                <p className="chat-bubble-text">{msg.content}</p>

                {msg.quoteText && (
                  <blockquote className="chat-welcome-quote">
                    {msg.quoteText}
                  </blockquote>
                )}

                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="chat-recommendations-list">
                    {msg.recommendations.map((rental) => (
                      <div key={rental.id} className="chat-recommendation-card">
                        <div className="chat-card-top">
                          <div className="chat-card-info">
                            <h4 className="chat-card-title">{rental.title}</h4>
                            <p className="chat-card-locality">
                              <MapPin size={12} aria-hidden="true" />
                              <span>{rental.locality}</span>
                            </p>
                          </div>
                          <div className="chat-card-price-badge">
                            <span className="chat-card-price">{formatPrice(rental.price)}</span>
                            <span className="chat-card-basis"> / mo</span>
                          </div>
                        </div>

                        <div className="chat-card-amenities">
                          <span className="chat-card-tag">{rental.type}</span>
                          {rental.amenities.includes("Wi-Fi") && (
                            <span className="chat-card-tag is-wifi">
                              <Wifi size={11} aria-hidden="true" /> Wi-Fi
                            </span>
                          )}
                        </div>

                        {onShowOnMap && (
                          <button
                            type="button"
                            className="chat-show-on-map-btn"
                            onClick={() => onShowOnMap(rental.id)}
                            aria-label={`Show ${rental.title} on map`}
                          >
                            <span>Show on map</span>
                            <ExternalLink size={12} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isFirstWelcome && messages.length === 1 && (
                <ChatQuickChips onSelectPrompt={onSelectPrompt} disabled={isTyping} />
              )}
            </div>
          </div>
        );
      })}

      {isTyping && (
        <div className="chat-message-row is-assistant" role="status" aria-label="AbangCebu is searching">
          <div className="chat-msg-avatar" aria-hidden="true">
            <Image
              src="/icons/chatbot_logo.png"
              alt=""
              width={28}
              height={28}
              className="chat-avatar-img"
            />
          </div>
          <div className="chat-bubble-wrap">
            <div className="chat-bubble is-typing">
              <span className="chat-typing-dot" />
              <span className="chat-typing-dot" />
              <span className="chat-typing-dot" />
            </div>
          </div>
        </div>
      )}

      <div ref={scrollEndRef} aria-hidden="true" />
    </div>
  );
}

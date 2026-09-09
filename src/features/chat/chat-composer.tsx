"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [inputText, setInputText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || disabled) return;
    onSend(inputText);
    setInputText("");
  };

  const isSendActive = Boolean(inputText.trim());

  return (
    <div className="chat-composer-wrapper">
      <form className="chat-composer-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-composer-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask anything (e.g. 'Room near IT Park under ₱3k')..."
          aria-label="Message AbangCebu rental companion"
          disabled={disabled}
        />
        <Button
          type="submit"
          size="icon-sm"
          className={`chat-composer-send-btn ${isSendActive ? "is-active" : ""}`}
          disabled={!isSendActive || disabled}
          aria-label="Send message"
        >
          <ArrowUp size={16} aria-hidden="true" />
        </Button>
      </form>
      <p className="chat-notice">Preview conversation · no AI connected</p>
    </div>
  );
}

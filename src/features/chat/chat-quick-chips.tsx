"use client";

import { Sparkles } from "lucide-react";
import { INITIAL_QUICK_PROMPTS } from "./use-chat-preview";

interface ChatQuickChipsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export function ChatQuickChips({ onSelectPrompt, disabled }: ChatQuickChipsProps) {
  return (
    <div className="chat-quick-chips-wrapper" role="region" aria-label="Suggested questions">
      <div className="chat-chips-label">
        <Sparkles size={13} aria-hidden="true" className="chat-chips-sparkle" />
        <span>Suggestions</span>
      </div>
      <div className="chat-quick-chips" role="group" aria-label="Quick search prompts">
        {INITIAL_QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="chat-prompt-chip"
            disabled={disabled}
            onClick={() => onSelectPrompt(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

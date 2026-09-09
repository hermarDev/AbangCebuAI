"use client";

import Image from "next/image";
import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ChatHeaderProps {
  onReset: () => void;
}

export function ChatHeader({ onReset }: ChatHeaderProps) {
  return (
    <div className="chat-dialog-header-wrap">
      {/* Visual drag handle for mobile sheet */}
      <div className="chat-sheet-handle" aria-hidden="true" />

      <DialogHeader className="chat-header-main">
        <div className="chat-header-left">
          <div className="chat-symbol" aria-hidden="true">
            <Image
              src="/icons/chatbot_logo.png"
              alt="AbangCebu AI Chatbot"
              width={38}
              height={38}
              className="chat-dialog-avatar"
            />
            <span className="chat-status-indicator" title="Online" aria-hidden="true" />
          </div>

          <div className="chat-header-titles">
            <p className="eyebrow chat-eyebrow">YOUR LOCAL RENTAL COMPANION</p>
            <DialogTitle className="chat-title">Your Cebu rental companion</DialogTitle>
            <DialogDescription className="chat-subtitle">
              Ask about budgets, neighborhoods, and nearby boarding houses
            </DialogDescription>
          </div>
        </div>

        <div className="chat-header-actions">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="chat-reset-btn"
            onClick={onReset}
            aria-label="Reset conversation"
            title="Start new conversation"
          >
            <RotateCcw size={16} aria-hidden="true" />
          </Button>

          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="chat-close-btn"
              aria-label="Close chat"
            >
              <X size={18} aria-hidden="true" />
            </Button>
          </DialogClose>
        </div>
      </DialogHeader>
    </div>
  );
}

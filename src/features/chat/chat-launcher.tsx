"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useChatPreview } from "./use-chat-preview";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { ChatComposer } from "./chat-composer";

interface ChatLauncherProps {
  onSelectRental?: (rentalId: string) => void;
}

export function ChatLauncher({ onSelectRental }: ChatLauncherProps) {
  const [open, setOpen] = useState(false);

  const handleShowOnMap = (rentalId: string) => {
    onSelectRental?.(rentalId);
    // On mobile screens, minimize chat so user immediately sees the highlighted listing on the map
    if (typeof window !== "undefined" && window.innerWidth <= 640) {
      setOpen(false);
    }
  };

  const { messages, isTyping, sendMessage, resetChat } = useChatPreview(handleShowOnMap);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="chat-launcher"
          size="icon"
          aria-label="Ask AbangCebu"
          data-chat-open={open}
        >
          <div className="chat-launcher-inner">
            <Image
              src="/icons/chatbot_logo.png"
              alt=""
              width={56}
              height={56}
              className="chat-launcher-avatar"
              aria-hidden="true"
            />
            <span className="chat-launcher-status-badge" aria-hidden="true" />
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="chat-dialog" showCloseButton={false}>
        <ChatHeader onReset={resetChat} />
        <ChatMessages
          messages={messages}
          isTyping={isTyping}
          onSelectPrompt={sendMessage}
          onShowOnMap={handleShowOnMap}
        />
        <ChatComposer onSend={sendMessage} disabled={isTyping} />
      </DialogContent>
    </Dialog>
  );
}

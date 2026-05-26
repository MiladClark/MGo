import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Code2,
  BookOpen,
  Lightbulb,
  FileSearch,
  PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import type { PendingAttachment } from "@/lib/attachments";
import { Logo } from "@/components/Logo";
import { useChatStore } from "@/stores/chatStore";
import { useConversationsStore } from "@/stores/conversationsStore";
import { cn } from "@/lib/utils";

const SUGGESTION_ICONS = [
  Lightbulb,
  Code2,
  BookOpen,
  PenLine,
  FileSearch,
  Sparkles,
] as const;

/** Within this distance from bottom, user is considered "following" the stream */
const FOLLOW_BOTTOM_THRESHOLD = 80;

export function ChatArea() {
  const { t } = useTranslation();
  const activeId = useConversationsStore((s) => s.activeId);
  const conversations = useConversationsStore((s) => s.conversations);
  const active = conversations.find((c) => c.id === activeId);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const error = useChatStore((s) => s.error);
  const clearError = useChatStore((s) => s.clearError);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** User wants new tokens to keep view pinned to bottom */
  const followStreamRef = useRef(true);
  const prevMessageCountRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);

  const messages = active?.messages ?? [];
  const isEmpty = messages.length === 0;

  const suggestionKeys = [
    "chat.suggestions.explain",
    "chat.suggestions.code",
    "chat.suggestions.persian",
    "chat.suggestions.write",
    "chat.suggestions.summarize",
    "chat.suggestions.translate",
  ] as const;

  const distanceFromBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return 0;
    return el.scrollHeight - el.scrollTop - el.clientHeight;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (!el) return;
    isProgrammaticScrollRef.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior });
    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false;
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    const dist = distanceFromBottom();
    followStreamRef.current = dist <= FOLLOW_BOTTOM_THRESHOLD;
  }, [distanceFromBottom]);

  useEffect(() => {
    followStreamRef.current = true;
    prevMessageCountRef.current = 0;
    requestAnimationFrame(() => scrollToBottom("auto"));
  }, [activeId, scrollToBottom]);

  useEffect(() => {
    if (isEmpty) return;

    const prevCount = prevMessageCountRef.current;
    const newCount = messages.length;
    prevMessageCountRef.current = newCount;

    const addedMessages = newCount > prevCount;
    const userSentNewMessage =
      addedMessages &&
      messages
        .slice(prevCount)
        .some((m) => m.role === "user");

    if (userSentNewMessage) {
      followStreamRef.current = true;
      scrollToBottom("smooth");
      return;
    }

    // Never auto-scroll while the model is streaming (content height grows).
    // User can scroll freely; only re-follow if they scroll back near the bottom.
    if (isStreaming) return;

    if (addedMessages && followStreamRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages, isStreaming, isEmpty, scrollToBottom]);

  const handleSend = (text: string, attachments: PendingAttachment[]) => {
    followStreamRef.current = true;
    void sendMessage(text, attachments);
  };

  if (isEmpty) {
    return (
      <div className="flex h-full flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-3 pb-4 pt-2 sm:px-4 sm:pb-6">
          <div className="mb-6 flex flex-col items-center text-center sm:mb-10">
            <Logo variant="wordmark" className="mb-3 h-10 sm:mb-4 sm:h-14" />
            <p className="text-sm text-muted-foreground">{t("app.heroSubtitle")}</p>
          </div>

          <ChatInput centered onSend={handleSend} />

          <p className="mb-3 mt-6 text-center text-xs text-muted-foreground sm:mb-4 sm:mt-8">
            {t("chat.trySuggestions")}
          </p>
          <div className="grid w-full max-w-3xl grid-cols-1 gap-2 px-1 sm:grid-cols-2 sm:px-0">
            {suggestionKeys.map((key, i) => {
              const Icon = SUGGESTION_ICONS[i] ?? Sparkles;
              return (
                <Button
                  key={key}
                  variant="outline"
                  className="h-auto justify-start gap-3 rounded-2xl border-border/60 bg-card/40 px-4 py-3.5 text-start text-sm font-normal hover:bg-card/80"
                  onClick={() => void sendMessage(t(key))}
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="leading-relaxed">{t(key)}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn(
          "mgo-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden",
          "[overflow-anchor:none]",
        )}
      >
        <div className="mx-auto w-full max-w-3xl space-y-6 px-3 py-4 [overflow-anchor:none] sm:space-y-8 sm:px-4 sm:py-8">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {isStreaming && (
            <p
              className="animate-pulse text-sm text-muted-foreground"
              dir="rtl"
            >
              {t("chat.thinking")}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div
          className="mx-2 mb-2 flex max-w-3xl items-center justify-between gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:mx-auto sm:px-4"
          dir="rtl"
        >
          <span>
            {error === "noModel"
              ? t("chat.errorNoModel")
              : t("chat.errorGeneric")}
          </span>
          <Button variant="ghost" size="sm" onClick={clearError}>
            ×
          </Button>
        </div>
      )}

      <ChatInput onSend={handleSend} />
    </div>
  );
}

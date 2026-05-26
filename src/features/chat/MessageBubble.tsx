import { useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { messageDirection } from "@/lib/persian";
import type { ChatMessage } from "@/lib/lmstudio/types";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const dir = messageDirection(message.role, message.content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "group flex w-full [overflow-anchor:none]",
        isUser ? "justify-start" : "justify-start",
      )}
    >
      <div
        className={cn(
          "relative w-full max-w-3xl rounded-2xl px-5 py-4",
          isUser
            ? "bg-secondary/80 border border-border/60"
            : "bg-transparent",
        )}
        dir={dir}
        lang={dir === "rtl" ? "fa" : undefined}
      >
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {message.attachments.map((att) =>
              att.type === "image" && att.previewUrl ? (
                <img
                  key={att.id}
                  src={att.previewUrl}
                  alt={att.name}
                  className="max-h-48 max-w-full rounded-lg border border-border object-contain"
                />
              ) : (
                <span
                  key={att.id}
                  className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {att.name}
                </span>
              ),
            )}
          </div>
        )}

        {isUser ? (
          <p className="whitespace-pre-wrap text-[15px] leading-8 text-foreground">
            {message.content}
          </p>
        ) : (
          <div className="prose-chat text-[15px] leading-8">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {message.content || "…"}
            </ReactMarkdown>
          </div>
        )}

        {!isUser && message.content && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute start-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => void handleCopy()}
            title={t("chat.copy")}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

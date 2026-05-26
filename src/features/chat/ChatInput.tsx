import { useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowUp,
  Plus,
  Square,
  X,
  ImageIcon,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  fileToAttachment,
  type PendingAttachment,
} from "@/lib/attachments";
import { useChatStore } from "@/stores/chatStore";
import { useSettingsStore } from "@/stores/settingsStore";

interface ChatInputProps {
  onSend: (text: string, attachments: PendingAttachment[]) => void;
  centered?: boolean;
}

export function ChatInput({ onSend, centered = false }: ChatInputProps) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const stopStreaming = useChatStore((s) => s.stopStreaming);
  const models = useChatStore((s) => s.models);
  const selectedModel = useChatStore((s) => s.selectedModel);
  const setSelectedModel = useChatStore((s) => s.setSelectedModel);
  const connectionStatus = useSettingsStore((s) => s.connectionStatus);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const connected = connectionStatus === "connected";

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadError(null);
    for (const file of Array.from(files)) {
      try {
        const att = await fileToAttachment(file);
        setAttachments((prev) => [...prev, att]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.startsWith("IMAGE_TOO_LARGE")) {
          setUploadError(t("chat.uploadImageTooBig"));
        } else if (msg.startsWith("FILE_TOO_LARGE")) {
          setUploadError(t("chat.uploadFileTooBig"));
        } else {
          setUploadError(t("chat.uploadFailed"));
        }
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    onSend(trimmed, attachments);
    setText("");
    setAttachments([]);
    setUploadError(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming) handleSend();
    }
  };

  return (
    <div
      className={cn(
        "w-full px-4",
        centered ? "pb-8" : "border-t border-border/40 bg-background/90 py-4 backdrop-blur-xl",
      )}
    >
      <div className="mx-auto w-full max-w-3xl">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative flex items-center gap-2 rounded-xl border border-border bg-card/80 px-2 py-1.5"
              >
                {att.type === "image" ? (
                  <img
                    src={att.dataUrl}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <FileText className="h-8 w-8 text-muted-foreground p-1" />
                )}
                <span className="max-w-[120px] truncate text-xs">{att.name}</span>
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-muted"
                  onClick={() => removeAttachment(att.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-3xl border border-border/80 bg-card/90 shadow-2xl shadow-black/20 ring-1 ring-white/5 transition-shadow focus-within:ring-primary/30">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("chat.placeholder")}
            rows={centered ? 2 : 1}
            dir="rtl"
            className="min-h-[56px] max-h-[220px] resize-none border-0 bg-transparent px-5 pt-5 pb-2 text-[15px] leading-relaxed shadow-none focus-visible:ring-0"
            disabled={isStreaming}
          />

          <div className="flex items-center justify-between gap-2 px-3 pb-3">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept="image/*,.txt,.md,.json,.pdf,.csv"
                onChange={(e) => void handleFiles(e.target.files)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
                onClick={() => fileInputRef.current?.click()}
                title={t("chat.attach")}
              >
                <Plus className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = "image/*";
                    fileInputRef.current.click();
                    fileInputRef.current.accept =
                      "image/*,.txt,.md,.json,.pdf,.csv";
                  }
                }}
                title={t("chat.attachImage")}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <span
                className={cn(
                  "ms-1 hidden rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline",
                  connected
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {connected ? t("header.connected") : t("header.disconnected")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={selectedModel || undefined}
                onValueChange={setSelectedModel}
                disabled={models.length === 0}
              >
                <SelectTrigger
                  className="h-9 max-w-[200px] border-0 bg-muted/50 text-xs"
                  dir="ltr"
                >
                  <SelectValue placeholder={t("header.selectModel")} />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isStreaming ? (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-9 w-9 shrink-0 rounded-xl"
                  onClick={stopStreaming}
                >
                  <Square className="h-4 w-4 fill-current" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl bg-primary hover:bg-primary/90"
                  onClick={handleSend}
                  disabled={!text.trim() && attachments.length === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {uploadError && (
          <p className="mt-2 text-center text-xs text-destructive">{uploadError}</p>
        )}
      </div>
    </div>
  );
}

import {

  useEffect,

  useRef,

  useState,

  type ClipboardEvent,

  type DragEvent,

  type KeyboardEvent,

} from "react";

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

import { getModelDisplayTitle, getModelLabel } from "@/lib/modelDisplayName";
import { cn } from "@/lib/utils";

import {

  fileToAttachment,

  type PendingAttachment,

} from "@/lib/attachments";

import {

  getClipboardImageFiles,

  supportsModelVision,

} from "@/lib/modelVision";

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

  const [isDragging, setIsDragging] = useState(false);

  const isStreaming = useChatStore((s) => s.isStreaming);

  const stopStreaming = useChatStore((s) => s.stopStreaming);

  const models = useChatStore((s) => s.models);

  const selectedModel = useChatStore((s) => s.selectedModel);

  const setSelectedModel = useChatStore((s) => s.setSelectedModel);

  const connectionStatus = useSettingsStore((s) => s.connectionStatus);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const dragDepthRef = useRef(0);



  const connected = connectionStatus === "connected";

  const supportsVision = supportsModelVision(selectedModel, models);



  useEffect(() => {

    if (supportsVision) return;

    setAttachments((prev) => {

      const next = prev.filter((a) => a.type !== "image");

      return next.length === prev.length ? prev : next;

    });

  }, [supportsVision]);



  const handleFiles = async (files: FileList | File[] | null) => {

    if (!files?.length) return;

    setUploadError(null);

    let rejectedImage = false;



    for (const file of Array.from(files)) {

      const isImage = file.type.startsWith("image/");

      if (isImage && !supportsVision) {

        rejectedImage = true;

        continue;

      }

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



    if (rejectedImage) {

      setUploadError(t("chat.modelNoVision"));

    }

    if (fileInputRef.current) fileInputRef.current.value = "";

  };



  const openImagePicker = () => {

    if (!supportsVision || !fileInputRef.current) return;

    fileInputRef.current.accept = "image/*";

    fileInputRef.current.click();

    fileInputRef.current.accept = "image/*,.txt,.md,.json,.pdf,.csv";

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



  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {

    const imageFiles = getClipboardImageFiles(e.clipboardData);

    if (imageFiles.length === 0) return;

    e.preventDefault();

    if (!supportsVision) {

      setUploadError(t("chat.modelNoVision"));

      return;

    }

    void handleFiles(imageFiles);

  };



  const onDragEnter = (e: DragEvent<HTMLDivElement>) => {

    e.preventDefault();

    e.stopPropagation();

    dragDepthRef.current += 1;

    if (supportsVision) setIsDragging(true);

  };



  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {

    e.preventDefault();

    e.stopPropagation();

    dragDepthRef.current -= 1;

    if (dragDepthRef.current <= 0) {

      dragDepthRef.current = 0;

      setIsDragging(false);

    }

  };



  const onDragOver = (e: DragEvent<HTMLDivElement>) => {

    e.preventDefault();

    e.stopPropagation();

    if (supportsVision) {

      e.dataTransfer.dropEffect = "copy";

    } else {

      e.dataTransfer.dropEffect = "none";

    }

  };



  const onDrop = (e: DragEvent<HTMLDivElement>) => {

    e.preventDefault();

    e.stopPropagation();

    dragDepthRef.current = 0;

    setIsDragging(false);



    const dropped = Array.from(e.dataTransfer.files);

    const images = dropped.filter((f) => f.type.startsWith("image/"));

    if (images.length === 0) return;



    if (!supportsVision) {

      setUploadError(t("chat.modelNoVision"));

      return;

    }

    void handleFiles(images);

  };



  return (

    <div

      className={cn(

        "w-full px-2 pb-safe sm:px-4",

        centered

          ? "pb-6 sm:pb-8"

          : "border-t border-border/40 bg-background/90 py-3 backdrop-blur-xl sm:py-4",

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



        <div

          className={cn(

            "relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 shadow-2xl shadow-black/10 ring-1 ring-border/40 transition-shadow focus-within:ring-primary/40 dark:shadow-black/25 dark:ring-white/5 sm:rounded-3xl",

            isDragging &&

              supportsVision &&

              "ring-2 ring-primary/60 border-primary/40",

          )}

          onDragEnter={onDragEnter}

          onDragLeave={onDragLeave}

          onDragOver={onDragOver}

          onDrop={onDrop}

        >

          {isDragging && supportsVision && (

            <div

              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-[1px] sm:rounded-3xl"

              aria-hidden

            >

              <p className="text-sm font-medium text-primary">

                {t("chat.dropImageHint")}

              </p>

            </div>

          )}



          <Textarea

            ref={textareaRef}

            value={text}

            onChange={(e) => setText(e.target.value)}

            onKeyDown={onKeyDown}

            onPaste={onPaste}

            placeholder={t("chat.placeholder")}

            rows={centered ? 2 : 1}

            dir="rtl"

            className="min-h-[52px] max-h-[180px] resize-none border-0 bg-transparent px-3 pt-4 pb-2 text-[15px] leading-relaxed shadow-none focus-visible:ring-0 sm:min-h-[56px] sm:max-h-[220px] sm:px-5 sm:pt-5"

            disabled={isStreaming}

          />



          <div className="flex w-full min-w-0 flex-col gap-2 px-2 pb-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-3 sm:pb-3">

            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">

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

                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"

                onClick={() => fileInputRef.current?.click()}

                title={t("chat.attach")}

                disabled={isStreaming}

              >

                <Plus className="h-5 w-5" />

              </Button>

              <Button

                type="button"

                variant="ghost"

                size="icon"

                disabled={!supportsVision || isStreaming}

                className={cn(

                  "h-9 w-9 shrink-0",

                  supportsVision

                    ? "text-muted-foreground hover:text-foreground"

                    : "cursor-not-allowed text-destructive opacity-90 hover:bg-transparent hover:text-destructive",

                )}

                onClick={openImagePicker}

                title={

                  supportsVision ? t("chat.attachImage") : t("chat.modelNoVision")

                }

              >

                <ImageIcon className="h-4 w-4" />

              </Button>

              <span

                className={cn(

                  "ms-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",

                  connected

                    ? "bg-success/15 text-success"

                    : "bg-muted text-muted-foreground",

                )}

              >

                {connected ? t("header.connected") : t("header.disconnected")}

              </span>

            </div>



            <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:max-w-[min(100%,280px)] sm:shrink-0">

              <Select

                value={selectedModel || undefined}

                onValueChange={setSelectedModel}

                disabled={models.length === 0}

              >

                <SelectTrigger

                  className="h-9 w-full min-w-0 max-w-full border-0 bg-muted/50 text-xs sm:w-[200px]"

                  dir="ltr"

                >

                  <SelectValue placeholder={t("header.selectModel")} />

                </SelectTrigger>

                <SelectContent>

                  {models.map((m) => (

                    <SelectItem
                      key={m.id}
                      value={m.id}
                      title={getModelDisplayTitle(m.id)}
                    >
                      {getModelLabel(m)}
                    </SelectItem>

                  ))}

                </SelectContent>

              </Select>



              {isStreaming ? (

                <Button

                  size="icon"

                  variant="secondary"

                  className="h-9 w-9 shrink-0"

                  onClick={stopStreaming}

                >

                  <Square className="h-4 w-4 fill-current" />

                </Button>

              ) : (

                <Button

                  size="icon"

                  className="h-9 w-9 shrink-0 bg-primary hover:bg-primary/90"

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


import { useTranslation } from "react-i18next";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chatStore";
import { useSettingsStore } from "@/stores/settingsStore";

export function ChatHeader() {
  const { t } = useTranslation();
  const models = useChatStore((s) => s.models);
  const selectedModel = useChatStore((s) => s.selectedModel);
  const setSelectedModel = useChatStore((s) => s.setSelectedModel);
  const fetchModels = useChatStore((s) => s.fetchModels);
  const isLoadingModels = useChatStore((s) => s.isLoadingModels);
  const connectionStatus = useSettingsStore((s) => s.connectionStatus);

  const connected = connectionStatus === "connected";

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          connected
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        {connected ? (
          <Wifi className="h-3.5 w-3.5" />
        ) : (
          <WifiOff className="h-3.5 w-3.5" />
        )}
        {connected ? t("header.connected") : t("header.disconnected")}
      </div>

      <Select
        value={selectedModel || undefined}
        onValueChange={setSelectedModel}
        disabled={models.length === 0}
      >
        <SelectTrigger className="max-w-md flex-1">
          <SelectValue
            placeholder={
              models.length === 0
                ? t("header.noModels")
                : t("header.selectModel")
            }
          />
        </SelectTrigger>
        <SelectContent>
          {models.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => void fetchModels()}
        disabled={isLoadingModels}
        title={t("settings.testConnection")}
      >
        <RefreshCw
          className={cn("h-4 w-4", isLoadingModels && "animate-spin")}
        />
      </Button>
    </header>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MessageSquarePlus,
  Settings,
  Trash2,
  Pencil,
  PanelRightClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { useConversationsStore } from "@/stores/conversationsStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useChatStore } from "@/stores/chatStore";
import { useUiStore } from "@/stores/uiStore";

interface SidebarProps {
  onOpenSettings: () => void;
}

function clipTitle(title: string, max = 32): string {
  const t = title.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function Sidebar({ onOpenSettings }: SidebarProps) {
  const { t } = useTranslation();
  const conversations = useConversationsStore((s) => s.conversations);
  const activeId = useConversationsStore((s) => s.activeId);
  const setActive = useConversationsStore((s) => s.setActive);
  const createConversation = useConversationsStore((s) => s.createConversation);
  const deleteConversation = useConversationsStore((s) => s.deleteConversation);
  const setTitle = useConversationsStore((s) => s.setTitle);
  const defaultModel = useSettingsStore((s) => s.defaultModel);
  const selectedModel = useChatStore((s) => s.selectedModel);
  const connectionStatus = useSettingsStore((s) => s.connectionStatus);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const handleNewChat = () => {
    createConversation(selectedModel || defaultModel);
  };

  const startRename = (id: string, title: string) => {
    setRenamingId(id);
    setRenameValue(title);
  };

  const commitRename = (id: string) => {
    if (renameValue.trim()) setTitle(id, clipTitle(renameValue.trim(), 48));
    setRenamingId(null);
  };

  return (
    <aside
      className={cn(
        "flex h-full w-[280px] min-w-[280px] max-w-[280px] shrink-0 flex-col overflow-hidden border-s border-border/50 bg-sidebar/95 backdrop-blur-md",
      )}
    >
      <div className="flex items-center justify-between gap-1 p-3">
        <Logo variant="wordmark" className="h-8 max-w-[120px]" />
        <div className="flex shrink-0 items-center gap-0.5">
          <ThemeToggle className="h-8 w-8 shrink-0" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={toggleSidebar}
            title={t("sidebar.collapse")}
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="px-3 pb-2">
        <Button
          className="w-full justify-center gap-2 rounded-xl bg-primary font-medium shadow-md hover:bg-primary/90"
          onClick={handleNewChat}
        >
          <MessageSquarePlus className="h-4 w-4 shrink-0" />
          <span className="truncate">{t("sidebar.newChat")}</span>
        </Button>
      </div>

      <p className="shrink-0 px-4 py-2 text-xs font-medium text-muted-foreground">
        {t("sidebar.conversations")}
      </p>

      <div className="mgo-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2">
        <ul className="w-full space-y-0.5 pb-2">
          {conversations.map((c) => {
            const label = clipTitle(c.title);
            return (
              <li key={c.id} className="w-full max-w-full">
                {renamingId === c.id ? (
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(c.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(c.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="h-9 w-full min-w-0 text-sm"
                    autoFocus
                  />
                ) : (
                  <div
                    className={cn(
                      "group relative w-full max-w-full rounded-xl transition-colors",
                      activeId === c.id
                        ? "bg-sidebar-accent"
                        : "hover:bg-sidebar-accent/50",
                    )}
                  >
                    <button
                      type="button"
                      className="block w-full max-w-full overflow-hidden py-2.5 ps-3 pe-[4.25rem] text-start"
                      onClick={() => setActive(c.id)}
                      title={c.title}
                    >
                      <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-normal leading-snug text-sidebar-foreground">
                        {label}
                      </span>
                    </button>
                    <div className="absolute inset-y-0 end-0.5 flex items-center gap-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => startRename(c.id, c.title)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => deleteConversation(c.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="shrink-0 space-y-2 border-t border-sidebar-border p-3">
        <div className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground">
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              connectionStatus === "connected"
                ? "bg-emerald-500"
                : "bg-red-500/80",
            )}
          />
          <span className="truncate">
            {connectionStatus === "connected"
              ? t("header.connected")
              : t("header.disconnected")}
          </span>
        </div>
        <Button
          variant="ghost"
          className="w-full min-w-0 justify-start gap-2 rounded-xl"
          onClick={onOpenSettings}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span className="truncate">{t("sidebar.settings")}</span>
        </Button>
      </div>
    </aside>
  );
}

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PanelRightOpen } from "lucide-react";
import { Sidebar } from "@/features/conversations/Sidebar";
import { ChatArea } from "@/features/chat/ChatArea";
import { SettingsPanel } from "@/features/settings/SettingsPanel";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { testConnection } from "@/lib/lmstudio/client";
import { useSettingsStore } from "@/stores/settingsStore";
import { useConversationsStore } from "@/stores/conversationsStore";
import { useChatStore } from "@/stores/chatStore";
import { useUiStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateConversations = useConversationsStore((s) => s.hydrate);
  const hydrateUi = useUiStore((s) => s.hydrate);
  const settingsHydrated = useSettingsStore((s) => s.hydrated);
  const convHydrated = useConversationsStore((s) => s.hydrated);
  const uiHydrated = useUiStore((s) => s.hydrated);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const fetchModels = useChatStore((s) => s.fetchModels);
  const activeId = useConversationsStore((s) => s.activeId);
  const conversations = useConversationsStore((s) => s.conversations);
  const setSelectedModel = useChatStore((s) => s.setSelectedModel);
  const defaultModel = useSettingsStore((s) => s.defaultModel);
  const setConnectionStatus = useSettingsStore((s) => s.setConnectionStatus);
  const connection = useSettingsStore((s) => s.connection);

  useEffect(() => {
    void hydrateSettings();
    void hydrateConversations();
    void hydrateUi();
  }, [hydrateSettings, hydrateConversations, hydrateUi]);

  useEffect(() => {
    if (settingsHydrated && convHydrated) {
      void fetchModels();
    }
  }, [settingsHydrated, convHydrated, fetchModels]);

  useEffect(() => {
    if (!settingsHydrated) return;
    void (async () => {
      const result = await testConnection(connection);
      setConnectionStatus(result.ok ? "connected" : "disconnected");
    })();
  }, [
    settingsHydrated,
    connection.baseUrl,
    connection.apiKey,
    setConnectionStatus,
  ]);

  useEffect(() => {
    if (!activeId) return;
    const conv = conversations.find((c) => c.id === activeId);
    const target = conv?.model || defaultModel;
    if (!target) return;
    const current = useChatStore.getState().selectedModel;
    if (current === target) return;
    setSelectedModel(target);
  }, [activeId, conversations, defaultModel, setSelectedModel]);

  const ready = settingsHydrated && convHydrated && uiHydrated;

  if (!ready) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background text-foreground">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">MGo…</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <main className="relative flex min-w-0 flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="relative flex min-h-0 flex-1 flex-col">
          <ChatArea />
        </div>
      </main>

      <div
        className={cn(
          "shrink-0 overflow-hidden transition-[width] duration-300 ease-out",
          sidebarOpen ? "w-[280px]" : "w-0",
        )}
      >
        <div className="h-full w-[280px]">
          <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
        </div>
      </div>

      {!sidebarOpen && (
        <div className="absolute end-0 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1 pe-2">
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-xl border border-border shadow-lg"
            onClick={() => setSidebarOpen(true)}
            title={t("sidebar.expand")}
          >
            <PanelRightOpen className="h-5 w-5" />
          </Button>
          <ThemeToggle className="h-10 w-10 rounded-xl border border-border bg-card shadow-lg" />
        </div>
      )}

      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

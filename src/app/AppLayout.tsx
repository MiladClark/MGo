import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PanelRightOpen } from "lucide-react";
import { Sidebar } from "@/features/conversations/Sidebar";
import { ChatArea } from "@/features/chat/ChatArea";
import { SettingsPanel } from "@/features/settings/SettingsPanel";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { testConnection } from "@/lib/lmstudio/client";
import { useSettingsStore } from "@/stores/settingsStore";
import { useConversationsStore } from "@/stores/conversationsStore";
import { useChatStore } from "@/stores/chatStore";
import { useUiStore } from "@/stores/uiStore";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isMobile = useIsMobile();
  const locale = useSettingsStore((s) => s.locale);
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

  /** LTR: sidebar on the right; RTL (fa): sidebar on the left */
  const sidebarOnRight = locale === "en";

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

  useEffect(() => {
    if (!isMobile || !sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile, sidebarOpen]);

  const closeSidebar = () => setSidebarOpen(false);

  const ready = settingsHydrated && convHydrated && uiHydrated;

  if (!ready) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 bg-background text-foreground">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">MGo…</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-[100dvh] overflow-hidden bg-background">
      <main className="relative flex min-w-0 flex-1 flex-col">
        <MobileHeader onOpenSidebar={() => setSidebarOpen(true)} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent" />
        <div className="relative flex min-h-0 flex-1 flex-col">
          <ChatArea />
        </div>
      </main>

      {isMobile ? (
        <>
          {sidebarOpen && (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px]"
              onClick={closeSidebar}
              aria-label={t("sidebar.collapse")}
            />
          )}
          <div
            className={cn(
              "fixed inset-y-0 z-50 w-[min(100vw,300px)] max-w-[85vw] transition-transform duration-300 ease-out",
              sidebarOnRight ? "right-0" : "left-0",
              sidebarOpen
                ? "translate-x-0"
                : sidebarOnRight
                  ? "pointer-events-none translate-x-full"
                  : "pointer-events-none -translate-x-full",
            )}
          >
            <Sidebar
              onOpenSettings={() => {
                setSettingsOpen(true);
                closeSidebar();
              }}
              onClose={closeSidebar}
            />
          </div>
        </>
      ) : (
        <div
          className={cn(
            "shrink-0 overflow-hidden transition-[width] duration-300 ease-out",
            sidebarOpen ? "w-[280px]" : "w-0",
          )}
        >
          <div className="h-full w-[280px]">
            <Sidebar
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </div>
        </div>
      )}

      {!sidebarOpen && !isMobile && (
        <div className="absolute end-0 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-1 pe-2 md:flex">
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

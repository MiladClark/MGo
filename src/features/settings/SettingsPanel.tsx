import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listChatModels, testConnection } from "@/lib/lmstudio/client";
import type { Locale } from "@/lib/i18n";
import { useSettingsStore } from "@/stores/settingsStore";
import { useChatStore } from "@/stores/chatStore";
import { cn } from "@/lib/utils";

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PANEL_TRANSITION_MS = 300;

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const { t } = useTranslation();
  const settings = useSettingsStore();
  const locale = settings.locale;
  const fetchModels = useChatStore((s) => s.fetchModels);
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "ok" | "fail"
  >("idle");
  const [testError, setTestError] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [mounted, setMounted] = useState(open);
  const [panelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setPanelVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setPanelVisible(false);
    const timer = window.setTimeout(() => setMounted(false), PANEL_TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const handleTest = async () => {
    setTestStatus("testing");
    setTestError(null);
    const result = await testConnection(settings.connection);
    if (result.ok) {
      try {
        const chatModels = await listChatModels(settings.connection);
        setModels(chatModels.map((m) => m.id));
      } catch {
        setModels([]);
      }
      settings.setConnectionStatus("connected");
      setTestStatus("ok");
      void fetchModels();
    } else {
      settings.setConnectionStatus("disconnected");
      setTestStatus("fail");
      setTestError(result.error ?? null);
    }
  };

  const handleSave = async () => {
    await settings.save();
    void fetchModels();
    onOpenChange(false);
  };

  /** Physical screen edge — not logical start/end (RTL breaks those). */
  const dockRight = locale === "fa";

  if (!mounted) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300",
          panelVisible ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => onOpenChange(false)}
        aria-hidden={!panelVisible}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("settings.title")}
        dir={locale === "fa" ? "rtl" : "ltr"}
        className={cn(
          "fixed inset-y-0 z-50 flex w-full max-w-[min(100vw,420px)] flex-col border-border bg-card shadow-2xl transition-transform duration-300 ease-out",
          dockRight ? "right-0 border-l" : "left-0 border-r",
          panelVisible
            ? "translate-x-0"
            : dockRight
              ? "translate-x-full"
              : "-translate-x-full",
          !panelVisible && "pointer-events-none",
        )}
        style={{ transitionDuration: `${PANEL_TRANSITION_MS}ms` }}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">{t("settings.title")}</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-lg"
            onClick={() => onOpenChange(false)}
            aria-label={t("settings.close")}
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="mgo-scrollbar flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-5">
            <section className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
              <h3 className="text-sm font-semibold">{t("settings.connection")}</h3>
              <div className="space-y-2">
                <Label htmlFor="baseUrl">{t("settings.baseUrl")}</Label>
                <Input
                  id="baseUrl"
                  value={settings.connection.baseUrl}
                  onChange={(e) =>
                    settings.setConnection({ baseUrl: e.target.value })
                  }
                  dir="ltr"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">{t("settings.apiKey")}</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={settings.connection.apiKey}
                  onChange={(e) =>
                    settings.setConnection({ apiKey: e.target.value })
                  }
                  dir="ltr"
                  className="font-mono text-xs"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => void handleTest()}
              >
                {testStatus === "testing"
                  ? t("settings.testing")
                  : t("settings.testConnection")}
              </Button>
              {testStatus === "ok" && (
                <p className="text-xs text-primary">{t("settings.testSuccess")}</p>
              )}
              {testStatus === "fail" && (
                <div className="space-y-1">
                  <p className="text-xs text-destructive">
                    {t("settings.testFailed")}
                  </p>
                  {testError && (
                    <p
                      className="break-all font-mono text-[11px] text-destructive/90"
                      dir="ltr"
                    >
                      {testError}
                    </p>
                  )}
                </div>
              )}
              {import.meta.env.DEV && (
                <p className="text-[11px] text-muted-foreground">
                  {t("settings.devProxyHint")}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {t("settings.lmStudioHelp")}
              </p>
            </section>

            <section className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
              <h3 className="text-sm font-semibold">{t("settings.model")}</h3>
              <div className="space-y-2">
                <Label>{t("settings.defaultModel")}</Label>
                <Select
                  value={settings.defaultModel || undefined}
                  onValueChange={(v) => settings.setDefaultModel(v)}
                >
                  <SelectTrigger dir="ltr" className="text-xs">
                    <SelectValue placeholder={t("header.selectModel")} />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((id) => (
                      <SelectItem key={id} value={id} className="text-xs">
                        {id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">{t("settings.systemPrompt")}</Label>
                <Textarea
                  id="systemPrompt"
                  value={settings.inference.systemPrompt}
                  onChange={(e) =>
                    settings.setInference({ systemPrompt: e.target.value })
                  }
                  placeholder={t("settings.systemPromptPlaceholder")}
                  rows={3}
                  className="text-sm"
                />
              </div>
            </section>

            <section className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
              <h3 className="text-sm font-semibold">{t("settings.inference")}</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>{t("settings.temperature")}</Label>
                  <span dir="ltr" className="text-xs text-muted-foreground">
                    {settings.inference.temperature}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={2}
                  step={0.05}
                  value={[settings.inference.temperature]}
                  onValueChange={([v]) =>
                    settings.setInference({ temperature: v })
                  }
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>{t("settings.maxTokens")}</Label>
                  <span dir="ltr" className="text-xs text-muted-foreground">
                    {settings.inference.maxTokens}
                  </span>
                </div>
                <Slider
                  min={256}
                  max={8192}
                  step={256}
                  value={[settings.inference.maxTokens]}
                  onValueChange={([v]) =>
                    settings.setInference({ maxTokens: v })
                  }
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>{t("settings.topP")}</Label>
                  <span dir="ltr" className="text-xs text-muted-foreground">
                    {settings.inference.topP}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={[settings.inference.topP]}
                  onValueChange={([v]) => settings.setInference({ topP: v })}
                />
              </div>
            </section>

            <section className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
              <h3 className="text-sm font-semibold">{t("settings.appearance")}</h3>
              <div className="flex items-center justify-between gap-3">
                <Label>{t("settings.language")}</Label>
                <Select
                  value={settings.locale}
                  onValueChange={(v) => settings.setLocale(v as Locale)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fa">{t("settings.langFa")}</SelectItem>
                    <SelectItem value="en">{t("settings.langEn")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label>{t("settings.theme")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {settings.theme === "dark"
                      ? t("settings.themeDark")
                      : t("settings.themeLight")}
                  </p>
                </div>
                <Switch
                  checked={settings.theme === "dark"}
                  onCheckedChange={(checked) =>
                    settings.setTheme(checked ? "dark" : "light")
                  }
                />
              </div>
            </section>

            <section className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <h3 className="mb-2 text-sm font-semibold">{t("settings.about")}</h3>
              <p className="text-xs text-muted-foreground">
                {t("settings.aboutText", { version: "0.1.0" })}
              </p>
            </section>
          </div>
        </div>

        <footer className="shrink-0 border-t border-border p-4">
          <Button className="w-full rounded-xl" onClick={() => void handleSave()}>
            {t("settings.save")}
          </Button>
        </footer>
      </aside>
    </>
  );
}

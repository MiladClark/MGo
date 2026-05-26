import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { t } = useTranslation();
  const settings = useSettingsStore();
  const fetchModels = useChatStore((s) => s.fetchModels);
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "ok" | "fail"
  >("idle");
  const [testError, setTestError] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("settings.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <section className="space-y-3">
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
              />
            </div>
            <Button variant="outline" onClick={() => void handleTest()}>
              {testStatus === "testing"
                ? t("settings.testing")
                : t("settings.testConnection")}
            </Button>
            {testStatus === "ok" && (
              <p className="text-sm text-primary">{t("settings.testSuccess")}</p>
            )}
            {testStatus === "fail" && (
              <div className="space-y-1">
                <p className="text-sm text-destructive">
                  {t("settings.testFailed")}
                </p>
                {testError && (
                  <p
                    className="text-xs text-destructive/90 break-all font-mono"
                    dir="ltr"
                  >
                    {testError}
                  </p>
                )}
              </div>
            )}
            {import.meta.env.DEV && (
              <p className="text-xs text-muted-foreground">
                {t("settings.devProxyHint")}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("settings.lmStudioHelp")}
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">{t("settings.model")}</h3>
            <div className="space-y-2">
              <Label>{t("settings.defaultModel")}</Label>
              <Select
                value={settings.defaultModel || undefined}
                onValueChange={(v) => settings.setDefaultModel(v)}
              >
                <SelectTrigger dir="ltr">
                  <SelectValue placeholder={t("header.selectModel")} />
                </SelectTrigger>
                <SelectContent>
                  {models.map((id) => (
                    <SelectItem key={id} value={id}>
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
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">{t("settings.inference")}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t("settings.temperature")}</Label>
                <span dir="ltr">{settings.inference.temperature}</span>
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
                <span dir="ltr">{settings.inference.maxTokens}</span>
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
                <span dir="ltr">{settings.inference.topP}</span>
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

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">{t("settings.appearance")}</h3>
            <div className="flex items-center justify-between">
              <Label>{t("settings.language")}</Label>
              <Select
                value={settings.locale}
                onValueChange={(v) => settings.setLocale(v as Locale)}
              >
                <SelectTrigger className="w-36">
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

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">{t("settings.about")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("settings.aboutText", { version: "0.1.0" })}
            </p>
          </section>

          <Button className="w-full" onClick={() => void handleSave()}>
            {t("settings.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

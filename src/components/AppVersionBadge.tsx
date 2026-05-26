import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUpdateStore } from "@/stores/updateStore";

const VERSION = import.meta.env.VITE_APP_VERSION ?? "0.0.0";

export function AppVersionBadge() {
  const { t } = useTranslation();
  const status = useUpdateStore((s) => s.status);
  const result = useUpdateStore((s) => s.result);
  const applyUpdate = useUpdateStore((s) => s.applyUpdate);
  const dismissBanner = useUpdateStore((s) => s.dismissBanner);

  const [updateVisible, setUpdateVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const hasUpdate =
    status === "available" || status === "pulling" || status === "success";

  useEffect(() => {
    if (hasUpdate) {
      setUpdateVisible(true);
      setClosing(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setClosing(false));
      });
      return () => cancelAnimationFrame(id);
    }
    if (!updateVisible) return undefined;
    setClosing(true);
    const id = window.setTimeout(() => {
      setUpdateVisible(false);
      setClosing(false);
    }, 520);
    return () => window.clearTimeout(id);
  }, [hasUpdate, updateVisible]);

  useEffect(() => {
    if (status !== "success") return;
    const id = window.setTimeout(() => dismissBanner(), 2200);
    return () => window.clearTimeout(id);
  }, [status, dismissBanner]);

  const isPulling = status === "pulling";
  const isCritical = Boolean(result?.isCritical);
  const showOpen = updateVisible && hasUpdate && !closing;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-30 select-none",
        "max-md:bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))]",
        "max-md:right-[max(1rem,env(safe-area-inset-right,0px))]",
        updateVisible && "pointer-events-auto",
      )}
      aria-live="polite"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-full border px-3.5 py-1.5 shadow-lg backdrop-blur-xl",
          "ring-1 ring-inset ring-white/10 dark:ring-white/5",
          "bg-background/50 transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isCritical ? "border-amber-500/35" : "border-primary/30",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/15 via-transparent to-primary/10"
          aria-hidden
        />

        <div className="relative flex h-7 items-center gap-2">
          <span className="bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-[10px] font-bold uppercase tracking-[0.22em] text-transparent">
            MGo
          </span>
          <span className="h-3 w-px shrink-0 bg-primary/25" aria-hidden />
          <span className="shrink-0 font-mono text-[11px] font-medium tabular-nums tracking-wide text-foreground/75">
            v{VERSION}
          </span>

          {updateVisible && (
            <div
              className={cn(
                "flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                showOpen ? "max-w-56 opacity-100" : "max-w-0 opacity-0",
              )}
            >
              <span className="h-3 w-px shrink-0 bg-primary/25" aria-hidden />
              <span className="shrink-0 text-[11px] font-medium leading-none text-foreground/85">
                {t("update.newShort")}
              </span>
              <Button
                type="button"
                size="icon"
                className="h-7 w-7 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isPulling}
                onClick={() => void applyUpdate()}
                title={t("update.button")}
                aria-label={t("update.button")}
              >
                {isPulling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
              </Button>
              <button
                type="button"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
                onClick={dismissBanner}
                aria-label={t("update.dismiss")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useTranslation } from "react-i18next";
import { Download, Loader2, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUpdateStore } from "@/stores/updateStore";

export function UpdateBanner() {
  const { t } = useTranslation();
  const status = useUpdateStore((s) => s.status);
  const result = useUpdateStore((s) => s.result);
  const error = useUpdateStore((s) => s.error);
  const applyUpdate = useUpdateStore((s) => s.applyUpdate);
  const dismissBanner = useUpdateStore((s) => s.dismissBanner);

  if (
    status !== "available" &&
    status !== "pulling" &&
    status !== "success" &&
    status !== "error"
  ) {
    return null;
  }

  const versionLabel =
    result?.remoteVersion ?? result?.latestSha?.slice(0, 7) ?? "?";

  return (
    <div className="shrink-0 px-3 pb-2">
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border px-3 py-2.5 shadow-sm",
          "border-primary/35 bg-primary/10",
        )}
      >
        <button
          type="button"
          className="absolute end-1.5 top-1.5 rounded-md p-0.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          onClick={dismissBanner}
          aria-label={t("update.dismiss")}
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-start gap-2 pe-6">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs font-medium leading-snug text-foreground">
              {result?.isCritical
                ? t("update.critical", { version: versionLabel })
                : t("update.available", { version: versionLabel })}
            </p>

            {status === "success" && (
              <p className="text-[11px] text-muted-foreground">
                {t("update.restartHint")}
              </p>
            )}

            {status === "error" && error && (
              <p className="text-[11px] text-destructive">
                {error === "browser_only"
                  ? t("update.browserOnly")
                  : error === "no_git"
                    ? t("update.noGit")
                    : error}
              </p>
            )}

            {status !== "success" && (
              <Button
                size="sm"
                className="h-7 gap-1.5 rounded-lg bg-primary px-2.5 text-xs text-primary-foreground hover:bg-primary/90"
                disabled={status === "pulling"}
                onClick={() => void applyUpdate()}
              >
                {status === "pulling" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {status === "pulling"
                  ? t("update.pulling")
                  : t("update.button")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

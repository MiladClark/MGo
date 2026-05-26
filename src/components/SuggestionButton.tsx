import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SuggestionButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

export function SuggestionButton({ icon, label, onClick }: SuggestionButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const measure = useCallback(() => {
    const box = containerRef.current;
    const probe = measureRef.current;
    if (!box || !probe) return;
    setScrollDistance(Math.max(0, probe.scrollWidth - box.clientWidth));
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [label, measure]);

  const overflows = scrollDistance > 4;

  return (
    <Button
      type="button"
      variant="outline"
      className="group/suggestion h-auto w-full min-w-0 justify-start gap-3 overflow-hidden rounded-full border-border/60 bg-card/40 px-4 py-3.5 text-start text-sm font-normal text-foreground hover:bg-card/80 hover:text-foreground"
      onClick={onClick}
      onMouseEnter={() => overflows && setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      onFocus={() => overflows && setIsActive(true)}
      onBlur={() => setIsActive(false)}
      onTouchStart={() => overflows && setIsActive(true)}
      onTouchEnd={() => setIsActive(false)}
    >
      <span className="shrink-0 text-primary">{icon}</span>

      <div
        ref={containerRef}
        className={cn(
          "relative min-w-0 flex-1 overflow-hidden",
          overflows && !isActive && "suggestion-text-fade",
        )}
      >
        {/* Full-width probe — not clipped by flex min-width */}
        <span
          ref={measureRef}
          className="pointer-events-none invisible absolute top-0 end-0 whitespace-nowrap"
          aria-hidden
        >
          {label}
        </span>

        <span
          className={cn(
            "inline-block whitespace-nowrap text-end leading-relaxed",
            overflows && isActive && "animate-suggestion-marquee",
          )}
          style={
            overflows
              ? { ["--marquee-distance" as string]: `${scrollDistance}px` }
              : undefined
          }
        >
          {label}
        </span>
      </div>
    </Button>
  );
}

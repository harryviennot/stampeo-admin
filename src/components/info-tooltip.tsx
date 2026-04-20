"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  content: React.ReactNode;
  className?: string;
  iconClassName?: string;
  side?: "top" | "bottom";
}

export function InfoTooltip({
  content,
  className,
  iconClassName,
  side = "top",
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <span
      ref={rootRef}
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="Show info"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/70 hover:text-foreground"
      >
        <Info className={cn("h-3.5 w-3.5", iconClassName)} />
      </button>
      {open && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-1/2 z-20 w-64 -translate-x-1/2 rounded-md border bg-popover p-2.5 text-[11px] leading-snug text-popover-foreground shadow-md",
            side === "top" ? "bottom-full mb-2" : "top-full mt-2"
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}

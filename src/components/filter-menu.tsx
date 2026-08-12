"use client";

/**
 * Filter + sort controls shared by the admin list pages.
 *
 * Lifted verbatim out of `(dashboard)/businesses/page.tsx`, where they started
 * life as file-local components, when the card-design grid became the second
 * page needing them. `FilterMenu` is now a shell that takes its sections as
 * children, since the two pages filter on entirely different things.
 */

import * as React from "react";
import { ArrowUpDown, Check, ChevronDown, Filter as FilterIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** One chip group inside a FilterMenu. */
export function FilterSection<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md border px-2 py-1 text-xs transition-colors",
              value === opt.value
                ? "border-foreground bg-foreground text-background"
                : "border-input bg-background hover:bg-muted"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FilterMenu({
  activeCount,
  onClear,
  children,
}: {
  /** Drives the badge on the trigger; also enables/disables "Clear all". */
  activeCount: number;
  onClear: () => void;
  /** The `FilterSection`s for this page. */
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FilterIcon className="h-4 w-4" />
          Filter
          {activeCount > 0 && (
            <span className="rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-semibold text-background">
              {activeCount}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Filters</span>
          <button
            type="button"
            onClick={onClear}
            disabled={activeCount === 0}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <X className="h-3 w-3" /> Clear all
          </button>
        </div>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-3">
          {children}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export interface SortOption {
  key: string;
  label: string;
}

export function SortMenu({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly SortOption[];
  onChange: (key: string) => void;
}) {
  const current = options.find((o) => o.key === value) ?? options[0];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowUpDown className="h-4 w-4" />
          <span className="text-muted-foreground">Sort:</span>
          <span className="font-medium">{current?.label}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-1">
        <ul>
          {options.map((opt) => (
            <li key={opt.key}>
              <button
                type="button"
                onClick={() => onChange(opt.key)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
                  opt.key === value
                    ? "bg-muted font-medium"
                    : "hover:bg-muted/60"
                )}
              >
                <span>{opt.label}</span>
                {opt.key === value && <Check className="h-3.5 w-3.5" />}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

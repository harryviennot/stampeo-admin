import { type ChangelogArea } from "@/lib/api";
import { areaDotHex } from "@/lib/changelog-areas";

/** Linear-style area tag: a neutral pill with a small colored dot. */
export function AreaDot({ area }: { area: ChangelogArea }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: areaDotHex(area.color) }}
      />
      {area.label_en}
    </span>
  );
}

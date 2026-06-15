// Maps a changelog area's palette KEY (stored in changelog_areas.color, the DB
// source of truth) to Tailwind chip classes. Colors may repeat across areas —
// that's intentional, Linear-style. Keep the key list identical to the other
// `changelog-areas` maps (web / showcase) and the email inline-hex map.

export const AREA_CHIP_CLASSES: Record<string, string> = {
  indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  pink: "bg-pink-100 text-pink-700 border-pink-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  amber: "bg-amber-100 text-amber-800 border-amber-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  green: "bg-green-100 text-green-700 border-green-200",
  teal: "bg-teal-100 text-teal-700 border-teal-200",
  red: "bg-red-100 text-red-700 border-red-200",
};

export function areaChipClass(color: string | undefined | null): string {
  return (color && AREA_CHIP_CLASSES[color]) || AREA_CHIP_CLASSES.slate;
}

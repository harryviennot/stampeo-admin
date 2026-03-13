export function rgbToHex(rgb: string): string {
  if (!rgb) return '#1c1c1e';
  if (rgb.startsWith('#')) return rgb;
  const match = rgb.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (!match) return '#1c1c1e';
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

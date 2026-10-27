export const BUILTIN_BRANDS = [
  "Bambu Lab",
  "Sunlu",
  "Fiberon",
  "Siraya Tech",
  "American Filament",
  "3DFuel",
  "Prusament",
] as const;

export const FILAMENT_TYPES = [
  "PLA",
  "PLA Matte",
  "PLA Silk",
  "PLA+",
  "PETG",
  "PETG Matte",
  "PETG HF",
  "ABS",
  "ABS-CF",
  "ABS-GF",
  "ASA",
  "ASA-CF",
  "ASA-GF",
  "TPU",
  "Nylon",
  "PA6-CF",
  "PA12-CF",
  "PA612-CF",
  "PC",
  "PC-CF",
  "PVA",
  "Carbon Fiber PLA",
  "Carbon Fiber PETG",
  "Carbon Fiber Nylon",
  "Wood",
] as const;

export const COLORS = [
  { name: "Black", hex: "#161616" },
  { name: "White", hex: "#f7f7f4" },
  { name: "Gray", hex: "#8a877f" },
  { name: "Silver", hex: "#c6c9cd" },
  { name: "Red", hex: "#c62828" },
  { name: "Orange", hex: "#e36a12" },
  { name: "Yellow", hex: "#e2b31a" },
  { name: "Green", hex: "#2e8b46" },
  { name: "Lime", hex: "#8fbf22" },
  { name: "Teal", hex: "#1c8c86" },
  { name: "Blue", hex: "#2a62c9" },
  { name: "Navy", hex: "#1c2f66" },
  { name: "Purple", hex: "#6a3d9a" },
  { name: "Pink", hex: "#d45388" },
  { name: "Brown", hex: "#7a4e32" },
  { name: "Beige", hex: "#d7c4a3" },
  { name: "Gold", hex: "#c6a15a" },
  { name: "Natural", hex: "#e6d7bf" },
  { name: "Clear", hex: "#d5e3ea" },
] as const;

export const BEST_USES = [
  "Prototypes",
  "Functional parts",
  "Display models",
  "Outdoor parts",
  "Flexible parts",
  "High-temperature parts",
  "Supports",
  "Mechanical parts",
  "Enclosures",
  "Jigs and fixtures",
] as const;

export const PRINTERS = ["Bambu", "Prusa"] as const;

export const PRINTER_CASES = [
  "Bambu AMS",
  "Bambu spool holder",
  "Prusa enclosure",
  "Prusa spool holder",
  "Prusa USS Drybox",
  "Dry box",
  "Sealed bag",
  "Open shelf",
] as const;

export const SPOOL_SIZES = [250, 500, 1000, 2000, 3000] as const;

export type Printer = (typeof PRINTERS)[number];
export type FilamentColor = (typeof COLORS)[number]["name"];

export function colorHex(name: string): string {
  return COLORS.find((color) => color.name === name)?.hex ?? "#8a877f";
}

export function formatGrams(grams: number): string {
  if (!Number.isFinite(grams)) return "0 g";
  if (Math.abs(grams) >= 1000) {
    const kg = grams / 1000;
    const digits = Number.isInteger(kg) ? 0 : kg >= 10 ? 1 : 2;
    return `${kg.toFixed(digits)} kg`;
  }
  return `${Math.round(grams)} g`;
}

export function isLightHex(hex: string): boolean {
  const value = hex.replace("#", "");
  if (value.length !== 6) return false;
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.72;
}

export function normalizeBrand(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function validateBrandName(name: string, existing: readonly string[]): string | null {
  const normalized = normalizeBrand(name);
  if (!normalized) return "Enter a brand name.";
  if (normalized.length < 2) return "Use at least 2 characters.";
  if (normalized.length > 40) return "Keep the brand name under 40 characters.";
  if (!/^[\p{L}\p{N}][\p{L}\p{N}&+.'’ -]*$/u.test(normalized)) {
    return "Use letters, numbers, and simple punctuation.";
  }
  if (existing.some((brand) => brand.toLowerCase() === normalized.toLowerCase())) {
    return "That brand is already in the list.";
  }
  return null;
}

import {
  BEST_USES,
  BUILTIN_BRANDS,
  COLORS,
  FILAMENT_TYPES,
  PRINTER_CASES,
  PRINTERS,
  SPOOL_SIZES,
  formatCostInput,
  normalizeBrand,
  type Printer,
} from "@/lib/catalog";
import { bambuColorsFor, bambuTypes, isBambuBrand } from "@/lib/bambu-catalog";

export type Adjustment = {
  id: string;
  at: string;
  direction: "add" | "subtract";
  grams: number;
  reason: string;
};

export type Spool = {
  id: string;
  brand: string;
  type: string;
  color: string;
  bestUse: string;
  printer: Printer;
  printerCase: string;
  spoolGrams: number;
  remainingGrams: number;
  /** Price paid for this spool, in US cents. Null on shelves saved before costs existed. */
  costCents: number | null;
  notes: string;
  createdAt: string;
  adjustments: Adjustment[];
};

export type SpoolInput = Omit<Spool, "id" | "createdAt" | "adjustments">;

export type ShelfData = {
  customBrands: string[];
  spools: Spool[];
};

export type SpoolDraft = {
  brand: string;
  type: string;
  color: string;
  bestUse: string;
  printer: string;
  printerCase: string;
  spoolGrams: number;
  remainingGrams: string;
  cost: string;
  notes: string;
};

export type DraftErrors = Partial<
  Record<"brand" | "type" | "color" | "bestUse" | "printer" | "printerCase" | "remaining" | "cost" | "notes", string>
>;

export type ShelfFilters = {
  query: string;
  brand: string;
  type: string;
  color: string;
  bestUse: string;
  printer: string;
  printerCase: string;
  onlyLow: boolean;
  sort: "newest" | "brand" | "remaining" | "color";
};

export const defaultFilters: ShelfFilters = {
  query: "",
  brand: "all",
  type: "all",
  color: "all",
  bestUse: "all",
  printer: "all",
  printerCase: "all",
  onlyLow: false,
  sort: "newest",
};

const STORAGE_KEY = "spool-shelf-v1";

export function emptyShelf(): ShelfData {
  return { customBrands: [], spools: [] };
}

export function emptyDraft(): SpoolDraft {
  return {
    brand: "",
    type: "",
    color: "",
    bestUse: "",
    printer: "",
    printerCase: "",
    spoolGrams: 1000,
    remainingGrams: "1000",
    cost: "",
    notes: "",
  };
}

export function draftFromSpool(spool: Spool): SpoolDraft {
  return {
    brand: spool.brand,
    type: spool.type,
    color: spool.color,
    bestUse: spool.bestUse,
    printer: spool.printer,
    printerCase: spool.printerCase,
    spoolGrams: spool.spoolGrams,
    remainingGrams: String(spool.remainingGrams),
    cost: spool.costCents == null ? "" : formatCostInput(spool.costCents),
    notes: spool.notes,
  };
}

export function allBrands(customBrands: readonly string[]): string[] {
  const extras = dedupeCustom(customBrands).sort((a, b) => a.localeCompare(b));
  return [...BUILTIN_BRANDS, ...extras];
}

export function dedupeCustom(brands: readonly string[]): string[] {
  const seen = new Set<string>(BUILTIN_BRANDS.map((brand) => brand.toLowerCase()));
  const result: string[] = [];
  for (const brand of brands) {
    const name = normalizeBrand(brand);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}

export function spoolIsLow(spool: Pick<Spool, "remainingGrams" | "spoolGrams">): boolean {
  if (spool.spoolGrams <= 0) return true;
  return spool.remainingGrams / spool.spoolGrams <= 0.2;
}

export function spoolIsEmpty(spool: Pick<Spool, "remainingGrams">): boolean {
  return spool.remainingGrams <= 0;
}

export function validateDraft(
  draft: SpoolDraft,
  brands: readonly string[],
): { ok: true; value: SpoolInput } | { ok: false; errors: DraftErrors } {
  const errors: DraftErrors = {};
  const brand = normalizeBrand(draft.brand);
  if (!brand) errors.brand = "Choose a brand.";
  else if (!brands.some((item) => item.toLowerCase() === brand.toLowerCase())) {
    errors.brand = "Choose a brand from the list, or add it first.";
  }

  const bambu = isBambuBrand(brand);
  const typeAllowed = bambu ? bambuTypes().includes(draft.type) : FILAMENT_TYPES.includes(draft.type as (typeof FILAMENT_TYPES)[number]);
  const colorAllowed = bambu
    ? bambuColorsFor(draft.type).some((color) => color.name === draft.color) ||
      COLORS.some((color) => color.name === draft.color)
    : COLORS.some((color) => color.name === draft.color);
  if (!typeAllowed) errors.type = "Choose a filament type.";
  if (!colorAllowed) errors.color = "Choose a color.";
  if (!BEST_USES.includes(draft.bestUse as (typeof BEST_USES)[number])) {
    errors.bestUse = "Choose a best use.";
  }
  if (!PRINTERS.includes(draft.printer as Printer)) {
    errors.printer = "Choose Bambu or Prusa.";
  }
  if (!PRINTER_CASES.includes(draft.printerCase as (typeof PRINTER_CASES)[number])) {
    errors.printerCase = "Choose filament storage.";
  }
  if (!SPOOL_SIZES.includes(draft.spoolGrams as (typeof SPOOL_SIZES)[number])) {
    errors.remaining = "Choose a spool size.";
  }

  const remainingText = draft.remainingGrams.trim();
  const remaining = Number(remainingText);
  if (!remainingText || !Number.isInteger(remaining) || remaining < 0) {
    errors.remaining = "Enter whole grams left on the spool.";
  } else if (remaining > draft.spoolGrams) {
    errors.remaining = `This spool holds ${draft.spoolGrams} g.`;
  }

  const notes = draft.notes.trim();
  if (notes.length > 280) errors.notes = "Keep notes under 280 characters.";

  const costText = draft.cost.trim().replace(/^\$/, "").replace(/,/g, "");
  let costCents = 0;
  if (!costText) {
    errors.cost = "Enter the cost of this spool.";
  } else if (!/^\d+(\.\d{1,2})?$/.test(costText)) {
    errors.cost = "Use dollars and cents, like 15.99.";
  } else {
    costCents = Math.round(Number(costText) * 100);
    if (costCents > 999999) errors.cost = "Keep the cost under $10,000.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const canonicalBrand = brands.find((item) => item.toLowerCase() === brand.toLowerCase()) ?? brand;
  return {
    ok: true,
    value: {
      brand: canonicalBrand,
      type: draft.type,
      color: draft.color,
      bestUse: draft.bestUse,
      printer: draft.printer as Printer,
      printerCase: draft.printerCase,
      spoolGrams: draft.spoolGrams,
      remainingGrams: remaining,
      costCents,
      notes,
    },
  };
}

export function spoolMatches(spool: Spool, filters: ShelfFilters): boolean {
  if (filters.brand !== "all" && spool.brand !== filters.brand) return false;
  if (filters.type !== "all" && spool.type !== filters.type) return false;
  if (filters.color !== "all" && spool.color !== filters.color) return false;
  if (filters.bestUse !== "all" && spool.bestUse !== filters.bestUse) return false;
  if (filters.printer !== "all" && spool.printer !== filters.printer) return false;
  if (filters.printerCase !== "all" && spool.printerCase !== filters.printerCase) return false;
  if (filters.onlyLow && !spoolIsLow(spool)) return false;
  const query = filters.query.trim().toLowerCase();
  if (!query) return true;
  const haystack = [
    spool.brand,
    spool.type,
    spool.color,
    spool.bestUse,
    spool.printer,
    spool.printerCase,
    spool.notes,
    spool.costCents == null ? "" : (spool.costCents / 100).toFixed(2),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function sortSpools(spools: readonly Spool[], sort: ShelfFilters["sort"]): Spool[] {
  const copy = [...spools];
  copy.sort((a, b) => {
    if (sort === "brand") {
      return a.brand.localeCompare(b.brand) || a.type.localeCompare(b.type) || a.color.localeCompare(b.color);
    }
    if (sort === "remaining") {
      return a.remainingGrams - b.remainingGrams || a.brand.localeCompare(b.brand);
    }
    if (sort === "color") {
      return a.color.localeCompare(b.color) || a.brand.localeCompare(b.brand);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
  return copy;
}

export function filtersAreActive(filters: ShelfFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.brand !== "all" ||
    filters.type !== "all" ||
    filters.color !== "all" ||
    filters.bestUse !== "all" ||
    filters.printer !== "all" ||
    filters.printerCase !== "all" ||
    filters.onlyLow
  );
}

export function shelfStats(spools: readonly Spool[]) {
  return {
    count: spools.length,
    remainingGrams: spools.reduce((sum, spool) => sum + spool.remainingGrams, 0),
    bambu: spools.filter((spool) => spool.printer === "Bambu").length,
    prusa: spools.filter((spool) => spool.printer === "Prusa").length,
    low: spools.filter((spool) => spoolIsLow(spool)).length,
    costCents: spools.some((spool) => spool.costCents != null)
      ? spools.reduce((sum, spool) => sum + (spool.costCents ?? 0), 0)
      : null,
  };
}

export type LoadResult = {
  data: ShelfData;
  problem: "blocked" | "corrupt" | null;
};

export function loadShelf(): LoadResult {
  if (typeof window === "undefined") return { data: emptyShelf(), problem: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: emptyShelf(), problem: null };
    const parsed: unknown = JSON.parse(raw);
    const data = sanitizeShelf(parsed);
    if (!data) return { data: emptyShelf(), problem: "corrupt" };
    return { data, problem: null };
  } catch (error) {
    if (error instanceof SyntaxError) return { data: emptyShelf(), problem: "corrupt" };
    return { data: emptyShelf(), problem: "blocked" };
  }
}

export function saveShelf(data: ShelfData): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

function sanitizeShelf(parsed: unknown): ShelfData | null {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const record = parsed as Record<string, unknown>;
  const customBrands = Array.isArray(record.customBrands)
    ? dedupeCustom(record.customBrands.filter((brand): brand is string => typeof brand === "string"))
    : [];
  const spools = Array.isArray(record.spools)
    ? record.spools.flatMap((item) => {
        const spool = readSpool(item);
        return spool ? [spool] : [];
      })
    : [];
  return { customBrands, spools };
}

function isSpool(value: unknown): value is Omit<Spool, "adjustments"> & { adjustments?: unknown } {
  if (!value || typeof value !== "object") return false;
  const spool = value as Partial<Spool>;
  return (
    typeof spool.id === "string" &&
    typeof spool.brand === "string" &&
    typeof spool.type === "string" &&
    typeof spool.color === "string" &&
    typeof spool.bestUse === "string" &&
    (spool.printer === "Bambu" || spool.printer === "Prusa") &&
    typeof spool.printerCase === "string" &&
    typeof spool.spoolGrams === "number" &&
    typeof spool.remainingGrams === "number" &&
    typeof spool.notes === "string" &&
    typeof spool.createdAt === "string"
  );
}

function readCostCents(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 999999) return null;
  return value;
}

function readSpool(value: unknown): Spool | null {
  if (!isSpool(value)) return null;
  const costCents = readCostCents((value as { costCents?: unknown }).costCents);
  return { ...value, costCents, adjustments: readAdjustments(value.adjustments) };
}

function isAdjustment(value: unknown): value is Adjustment {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<Adjustment>;
  return (
    typeof entry.id === "string" &&
    typeof entry.at === "string" &&
    (entry.direction === "add" || entry.direction === "subtract") &&
    typeof entry.grams === "number" &&
    entry.grams > 0 &&
    typeof entry.reason === "string"
  );
}

function readAdjustments(value: unknown): Adjustment[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isAdjustment).sort((a, b) => b.at.localeCompare(a.at));
}

export function parseAdjustmentGrams(
  amount: string,
  unit: "g" | "kg",
): { ok: true; grams: number } | { ok: false; error: string } {
  const text = amount.trim().replace(/,/g, "");
  if (!text) return { ok: false, error: "Enter an amount." };
  const value = Number(text);
  if (!Number.isFinite(value) || value <= 0) return { ok: false, error: "Enter an amount greater than zero." };
  if (unit === "g") {
    if (!Number.isInteger(value)) return { ok: false, error: "Enter whole grams, or switch to kilograms." };
    return { ok: true, grams: value };
  }
  const grams = Math.round(value * 1000);
  if (grams <= 0) return { ok: false, error: "Enter an amount greater than zero." };
  return { ok: true, grams };
}

export function adjustSpool(
  spool: Spool,
  input: { direction: "add" | "subtract"; grams: number; reason: string; at: string; id: string },
): { ok: true; spool: Spool } | { ok: false; error: string } {
  const reason = input.reason.trim();
  if (!reason) return { ok: false, error: "Enter a reason." };
  if (reason.length > 120) return { ok: false, error: "Keep the reason under 120 characters." };
  if (!Number.isInteger(input.grams) || input.grams <= 0) {
    return { ok: false, error: "Enter an amount greater than zero." };
  }
  if (input.direction === "subtract" && input.grams > spool.remainingGrams) {
    return {
      ok: false,
      error: `Only ${spool.remainingGrams} g is on hand. That subtraction would go below zero.`,
    };
  }
  const remainingGrams =
    input.direction === "add" ? spool.remainingGrams + input.grams : spool.remainingGrams - input.grams;
  const adjustment: Adjustment = {
    id: input.id,
    at: input.at,
    direction: input.direction,
    grams: input.grams,
    reason,
  };
  return { ok: true, spool: { ...spool, remainingGrams, adjustments: [adjustment, ...spool.adjustments] } };
}

export function exampleSpools(): Spool[] {
  const base = Date.parse("2026-10-26T15:00:00.000Z");
  const rows: Array<SpoolInput & { hoursAgo: number }> = [
    {
      brand: "Bambu Lab",
      type: "PLA Matte",
      color: "Nardo Gray",
      bestUse: "Prototypes",
      printer: "Bambu",
      printerCase: "Bambu AMS",
      spoolGrams: 1000,
      remainingGrams: 640,
      costCents: 1599,
      notes: "AMS slot 1. Matte gray for fit checks.",
      hoursAgo: 6,
    },
    {
      brand: "Sunlu",
      type: "PETG",
      color: "Black",
      bestUse: "Functional parts",
      printer: "Prusa",
      printerCase: "Dry box",
      spoolGrams: 1000,
      remainingGrams: 880,
      costCents: 1299,
      notes: "Dried before the last bracket job.",
      hoursAgo: 20,
    },
    {
      brand: "Fiberon",
      type: "Carbon Fiber Nylon",
      color: "Black",
      bestUse: "Mechanical parts",
      printer: "Bambu",
      printerCase: "Dry box",
      spoolGrams: 500,
      remainingGrams: 260,
      costCents: 3499,
      notes: "Abrasive. Hardened nozzle only.",
      hoursAgo: 30,
    },
    {
      brand: "Siraya Tech",
      type: "ABS",
      color: "White",
      bestUse: "Enclosures",
      printer: "Bambu",
      printerCase: "Sealed bag",
      spoolGrams: 1000,
      remainingGrams: 1000,
      costCents: 2999,
      notes: "",
      hoursAgo: 48,
    },
    {
      brand: "American Filament",
      type: "PLA",
      color: "Red",
      bestUse: "Display models",
      printer: "Prusa",
      printerCase: "Open shelf",
      spoolGrams: 1000,
      remainingGrams: 160,
      costCents: 2499,
      notes: "Almost done. Order another spool.",
      hoursAgo: 70,
    },
    {
      brand: "3DFuel",
      type: "PLA+",
      color: "Blue",
      bestUse: "Prototypes",
      printer: "Prusa",
      printerCase: "Prusa spool holder",
      spoolGrams: 1000,
      remainingGrams: 720,
      costCents: 2799,
      notes: "",
      hoursAgo: 90,
    },
    {
      brand: "Sunlu",
      type: "TPU",
      color: "Orange",
      bestUse: "Flexible parts",
      printer: "Bambu",
      printerCase: "Sealed bag",
      spoolGrams: 500,
      remainingGrams: 410,
      costCents: 2199,
      notes: "Print slow. Keep the bag closed.",
      hoursAgo: 100,
    },
  ];

  return rows.map((row, index) => {
    const { hoursAgo, ...input } = row;
    const createdAt = new Date(base - hoursAgo * 60 * 60 * 1000).toISOString();
    return {
      ...input,
      id: `example-${index + 1}`,
      createdAt,
      adjustments:
        input.remainingGrams > 0
          ? [
              {
                id: `example-${index + 1}-open`,
                at: createdAt,
                direction: "add" as const,
                grams: input.remainingGrams,
                reason: "Added spool",
              },
            ]
          : [],
    };
  });
}

export function valuesInUse(spools: readonly Spool[], key: keyof Pick<Spool, "brand" | "type" | "color" | "bestUse" | "printer" | "printerCase">, preferred: readonly string[]): string[] {
  const used = new Set(spools.map((spool) => spool[key]));
  const ordered = [...new Set(preferred)].filter((value) => used.has(value));
  const extras = [...used].filter((value) => !preferred.includes(value)).sort((a, b) => a.localeCompare(b));
  return [...ordered, ...extras];
}

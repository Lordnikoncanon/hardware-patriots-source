"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { BrandDialog } from "@/components/brand-dialog";
import { HelpDialog } from "@/components/help-dialog";
import { OptionSelect } from "@/components/option-select";
import { SpoolFormDialog } from "@/components/spool-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BEST_USES,
  BUILTIN_BRANDS,
  FILAMENT_TYPES,
  PRINTER_CASES,
  PRINTERS,
  colorHex,
  formatGrams,
  isLightHex,
  normalizeBrand,
  validateBrandName,
} from "@/lib/catalog";
import {
  allBrands,
  defaultFilters,
  draftFromSpool,
  emptyDraft,
  exampleSpools,
  filtersAreActive,
  loadShelf,
  saveShelf,
  shelfStats,
  sortSpools,
  spoolIsEmpty,
  spoolIsLow,
  spoolMatches,
  valuesInUse,
  type ShelfData,
  type ShelfFilters,
  type Spool,
  type SpoolInput,
} from "@/lib/inventory";
import { cn } from "@/lib/utils";
import { appVersion } from "@/lib/version";

function spoolName(spool: Pick<Spool, "brand" | "color" | "type">) {
  return `${spool.brand} ${spool.color.toLowerCase()} ${spool.type}`;
}

function formatAdded(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Denver",
  }).format(date);
}

function SpoolMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="26" fill="none" stroke="var(--brand-blue)" strokeWidth="8" />
      <circle cx="32" cy="32" r="7" fill="var(--background)" stroke="var(--brand-blue)" strokeWidth="3" />
    </svg>
  );
}

function SpoolSwatch({ color }: { color: string }) {
  const hex = colorHex(color);
  return (
    <span
      role="img"
      aria-label={`${color} filament`}
      className="relative grid size-14 shrink-0 place-items-center rounded-full shadow-[0_8px_18px_-10px_rgba(12,24,64,0.45)] ring-1 ring-foreground/10"
      style={{
        background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), transparent 46%), ${hex}`,
      }}
    >
      <span className="size-5 rounded-full bg-background shadow-[inset_0_1px_2px_rgba(0,0,0,0.18)] ring-1 ring-foreground/10" />
    </span>
  );
}

const bubbleClass =
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium shadow-[0_1px_0_rgba(255,255,255,0.25)_inset]";

const themeKey = "hardware-patriots-theme";

function preferredDark() {
  const saved = localStorage.getItem(themeKey);
  return saved === "dark" || (saved !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

function toggleTheme() {
  const next = !document.documentElement.classList.contains("dark");
  applyTheme(next);
  localStorage.setItem(themeKey, next ? "dark" : "light");
}

export function SpoolShelf() {
  const [shelf, setShelf] = useState<ShelfData | null>(null);
  const [storageProblem, setStorageProblem] = useState<"blocked" | "corrupt" | null>(null);
  const [filters, setFilters] = useState<ShelfFilters>(defaultFilters);
  const [status, setStatus] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Spool | null>(null);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<Spool | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  useLayoutEffect(() => {
    applyTheme(preferredDark());
  }, []);

  useEffect(() => {
    const result = loadShelf();
    // The server render has no shelf. Read localStorage only after mount so hydration matches.
    /* eslint-disable react-hooks/set-state-in-effect */
    setShelf(result.data);
    setStorageProblem(result.problem);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const loaded = shelf;

  if (!loaded) {
    return (
      <div className="mx-auto grid w-full max-w-6xl gap-3 px-4 py-8 sm:px-6">
        <p className="sr-only">Loading the shelf</p>
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl bg-card" />
        ))}
      </div>
    );
  }

  const shelfData: ShelfData = loaded;
  const brands = allBrands(shelfData.customBrands);
  const stats = shelfStats(shelfData.spools);
  const visible = sortSpools(
    shelfData.spools.filter((spool) => spoolMatches(spool, filters)),
    filters.sort,
  );
  const filtering = filtersAreActive(filters);

  function updateFilter<K extends keyof ShelfFilters>(key: K, value: ShelfFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function commit(next: ShelfData) {
    setShelf(next);
    setStorageProblem(saveShelf(next) ? null : "blocked");
  }

  function addBrand(name: string): string | null {
    const error = validateBrandName(name, brands);
    if (error) return error;
    const normalized = normalizeBrand(name);
    commit({ ...shelfData, customBrands: [...shelfData.customBrands, normalized] });
    setStatus(`${normalized} is in the brand list.`);
    return null;
  }

  function removeBrand(name: string) {
    const builtin = BUILTIN_BRANDS.some((brand) => brand.toLowerCase() === name.toLowerCase());
    const used = shelfData.spools.some((spool) => spool.brand.toLowerCase() === name.toLowerCase());
    if (builtin || used) return;
    commit({
      ...shelfData,
      customBrands: shelfData.customBrands.filter((brand) => brand.toLowerCase() !== name.toLowerCase()),
    });
    setStatus(`${name} was removed from the brand list.`);
  }

  function openCreate() {
    setEditing(null);
    setFormMode("create");
    setBrandsOpen(false);
    setPendingRemove(null);
    setClearOpen(false);
  }

  function openEdit(spool: Spool) {
    setEditing(spool);
    setFormMode("edit");
    setBrandsOpen(false);
    setPendingRemove(null);
    setClearOpen(false);
  }

  function saveSpool(value: SpoolInput) {
    if (formMode === "edit" && editing) {
      commit({
        ...shelfData,
        spools: shelfData.spools.map((spool) => (spool.id === editing.id ? { ...spool, ...value } : spool)),
      });
      const updated = { ...editing, ...value };
      setStatus(
        spoolMatches(updated, filters)
          ? `Updated the ${spoolName(updated)} spool.`
          : `Updated the ${spoolName(updated)} spool. Clear the filters to see it.`,
      );
    } else {
      const spool: Spool = {
        ...value,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      commit({ ...shelfData, spools: [spool, ...shelfData.spools] });
      if (!spoolMatches(spool, filters)) {
        setFilters(defaultFilters);
        setStatus(`Added the ${spoolName(spool)} spool and cleared the filters so it shows.`);
      } else {
        setStatus(`Added the ${spoolName(spool)} spool.`);
      }
    }
    setFormMode(null);
    setEditing(null);
  }

  function duplicate(spool: Spool) {
    const copy: Spool = {
      ...spool,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    commit({ ...shelfData, spools: [copy, ...shelfData.spools] });
    setStatus(`Copied the ${spoolName(spool)} spool. Change the grams if the new one differs.`);
  }

  function removeSpool(spool: Spool) {
    commit({ ...shelfData, spools: shelfData.spools.filter((item) => item.id !== spool.id) });
    setPendingRemove(null);
    setStatus(`Removed the ${spoolName(spool)} spool.`);
  }

  function loadExamples() {
    commit({ ...shelfData, spools: exampleSpools() });
    setFilters(defaultFilters);
    setStatus("Loaded an example shelf. Remove any spool that is not yours.");
  }

  function clearShelf() {
    commit({ ...shelfData, spools: [] });
    setFilters(defaultFilters);
    setClearOpen(false);
    setStatus("Cleared the shelf. Added brands are still in the list.");
  }

  const brandFilter = valuesInUse(shelfData.spools, "brand", brands);
  const typeFilter = valuesInUse(shelfData.spools, "type", FILAMENT_TYPES);
  const colorFilter = valuesInUse(shelfData.spools, "color", []);
  const useFilter = valuesInUse(shelfData.spools, "bestUse", BEST_USES);
  const caseFilter = valuesInUse(shelfData.spools, "printerCase", PRINTER_CASES);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-6 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <SpoolMark className="size-11 text-primary" />
            <div>
              <h1 className="text-[1.7rem] leading-none font-semibold tracking-tight sm:text-4xl">Hardware Patriots</h1>
              <p className="mt-1 text-sm text-muted-foreground">Spool shelf</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Inventory for the Bambu and Prusa printers. Pick the material and color from the lists, then record the
            best use and which filament storage the spool lives in. Bambu Lab, Sunlu, Fiberon, Siraya Tech, American
            Filament, 3DFuel, and Prusament are already listed.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          <Button type="button" variant="outline" className="bg-card" onClick={toggleTheme}>
            <Sun className="hidden dark:block" />
            <Moon className="dark:hidden" />
            <span className="dark:hidden">Dark mode</span>
            <span className="hidden dark:inline">Light mode</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="bg-card"
            onClick={() => {
              setBrandsOpen(true);
              setFormMode(null);
            }}
          >
            Brands
          </Button>
          <Button
            type="button"
            variant="outline"
            className="bg-card"
            onClick={() => {
              setHelpOpen(true);
              setBrandsOpen(false);
              setFormMode(null);
            }}
          >
            Help
            <span className="text-muted-foreground tabular-nums">{appVersion}</span>
          </Button>
          <Button type="button" onClick={openCreate}>
            Add spool
          </Button>
        </div>
      </header>

      <section aria-label="Shelf summary" className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-4">
        {[
          ["Spools", String(stats.count)],
          ["Left", formatGrams(stats.remainingGrams)],
          ["Bambu", String(stats.bambu)],
          ["Prusa", String(stats.prusa)],
        ].map(([label, value]) => (
          <div key={label} className="bg-card px-4 py-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </section>

      {stats.low > 0 ? (
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{stats.low === 1 ? "1 spool is under 20%." : `${stats.low} spools are under 20%.`}</span>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            onClick={() => updateFilter("onlyLow", true)}
          >
            Show them
          </Button>
        </p>
      ) : null}

      {storageProblem === "corrupt" ? (
        <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-card px-3 py-2 text-sm">
          The saved shelf could not be read, so this one starts empty.
          <Button type="button" variant="link" className="h-auto px-2" onClick={() => setStorageProblem(null)}>
            Dismiss
          </Button>
        </p>
      ) : null}
      {storageProblem === "blocked" ? (
        <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-card px-3 py-2 text-sm">
          This computer is not storing the shelf. Spools stay in this window until you close it.
        </p>
      ) : null}
      {status ? (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          {status}
        </p>
      ) : null}

      {shelfData.spools.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
          <SpoolMark className="mx-auto size-16 text-primary" />
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">The shelf is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Add a spool with its brand, type, color, best use, and filament storage. Or load a few examples to see how a
            filled shelf reads.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={openCreate}>
              Add spool
            </Button>
            <Button type="button" variant="outline" onClick={loadExamples}>
              Load examples
            </Button>
          </div>
        </section>
      ) : (
        <>
          <section aria-label="Filter the shelf" className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="shelf-search">Search</Label>
              <Input
                id="shelf-search"
                value={filters.query}
                placeholder="Brand, color, notes"
                className="bg-card"
                onChange={(event) => updateFilter("query", event.target.value)}
              />
            </div>
            <OptionSelect
              id="filter-brand"
              label="Brand"
              value={filters.brand}
              placeholder="All brands"
              triggerClassName="bg-card"
              onValueChange={(value) => updateFilter("brand", value)}
              groups={[{ options: [{ value: "all", label: "All brands" }, ...brandFilter.map((value) => ({ value, label: value }))] }]}
            />
            <OptionSelect
              id="filter-type"
              label="Type"
              value={filters.type}
              placeholder="All types"
              triggerClassName="bg-card"
              onValueChange={(value) => updateFilter("type", value)}
              groups={[{ options: [{ value: "all", label: "All types" }, ...typeFilter.map((value) => ({ value, label: value }))] }]}
            />
            <OptionSelect
              id="filter-color"
              label="Color"
              value={filters.color}
              placeholder="All colors"
              triggerClassName="bg-card"
              onValueChange={(value) => updateFilter("color", value)}
              groups={[
                {
                  options: [
                    { value: "all", label: "All colors" },
                    ...colorFilter.map((value) => ({ value, label: value, swatch: colorHex(value) })),
                  ],
                },
              ]}
            />
            <OptionSelect
              id="filter-use"
              label="Best use"
              value={filters.bestUse}
              placeholder="All uses"
              triggerClassName="bg-card"
              onValueChange={(value) => updateFilter("bestUse", value)}
              groups={[{ options: [{ value: "all", label: "All uses" }, ...useFilter.map((value) => ({ value, label: value }))] }]}
            />
            <OptionSelect
              id="filter-printer"
              label="Printer"
              value={filters.printer}
              placeholder="All printers"
              triggerClassName="bg-card"
              onValueChange={(value) => updateFilter("printer", value)}
              groups={[{ options: [{ value: "all", label: "All printers" }, ...PRINTERS.map((value) => ({ value, label: value }))] }]}
            />
            <OptionSelect
              id="filter-case"
              label="Filament storage"
              value={filters.printerCase}
              placeholder="All storage"
              triggerClassName="bg-card"
              onValueChange={(value) => updateFilter("printerCase", value)}
              groups={[{ options: [{ value: "all", label: "All storage" }, ...caseFilter.map((value) => ({ value, label: value }))] }]}
            />
            <OptionSelect
              id="shelf-sort"
              label="Sort"
              value={filters.sort}
              placeholder="Sort"
              triggerClassName="bg-card"
              onValueChange={(value) => updateFilter("sort", value as ShelfFilters["sort"])}
              groups={[
                {
                  options: [
                    { value: "newest", label: "Newest" },
                    { value: "brand", label: "Brand" },
                    { value: "remaining", label: "Least remaining" },
                    { value: "color", label: "Color" },
                  ],
                },
              ]}
            />
          </section>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={filters.onlyLow ? "default" : "outline"}
              className={filters.onlyLow ? undefined : "bg-card"}
              aria-pressed={filters.onlyLow}
              disabled={stats.low === 0 && !filters.onlyLow}
              onClick={() => updateFilter("onlyLow", !filters.onlyLow)}
            >
              Running low{stats.low > 0 ? ` (${stats.low})` : ""}
            </Button>
            {filtering ? (
              <Button type="button" variant="ghost" onClick={() => setFilters((current) => ({ ...defaultFilters, sort: current.sort }))}>
                Clear filters
              </Button>
            ) : null}
            <p className="text-sm text-muted-foreground sm:ml-auto">
              Showing {visible.length} of {shelfData.spools.length}
            </p>
          </div>

          {visible.length === 0 ? (
            <section className="mt-6 rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
              <h2 className="text-2xl font-semibold">No spools match</h2>
              <p className="mt-2 text-sm text-muted-foreground">Try another brand, color, or printer.</p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => setFilters((current) => ({ ...defaultFilters, sort: current.sort }))}
              >
                Clear filters
              </Button>
            </section>
          ) : (
            <ul className="mt-4 grid gap-3">
              {visible.map((spool) => {
                const hex = colorHex(spool.color);
                const percent = spool.spoolGrams === 0 ? 0 : Math.round((spool.remainingGrams / spool.spoolGrams) * 100);
                const low = spoolIsLow(spool);
                const empty = spoolIsEmpty(spool);
                return (
                  <li key={spool.id}>
                    <article className="grid gap-4 rounded-2xl border bg-card p-4 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.55)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                      <SpoolSwatch color={spool.color} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <h2 className="text-base font-semibold">{spool.brand}</h2>
                          <p className="text-sm text-muted-foreground">{spool.type}</p>
                        </div>
                        <p className="mt-1 text-sm">
                          {spool.color}
                          <span className="text-muted-foreground"> · {spool.bestUse}</span>
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span
                            className={cn(
                              bubbleClass,
                              spool.printer === "Bambu"
                                ? "bg-blue-800/15 text-blue-950 dark:bg-blue-300/20 dark:text-blue-100"
                                : "bg-sky-700/15 text-sky-950 dark:bg-sky-300/20 dark:text-sky-100",
                            )}
                          >
                            {spool.printer}
                          </span>
                          <span className={cn(bubbleClass, "bg-muted text-foreground/80")}>{spool.printerCase}</span>
                          {empty ? (
                            <span className={cn(bubbleClass, "bg-destructive/12 text-destructive")}>Empty</span>
                          ) : low ? (
                            <span className={cn(bubbleClass, "bg-destructive/12 text-destructive")}>Low</span>
                          ) : null}
                        </div>
                        <div className="mt-3 max-w-md">
                          <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                            <span>
                              {formatGrams(spool.remainingGrams)} left of {formatGrams(spool.spoolGrams)}
                            </span>
                            <span className="tabular-nums">{percent}%</span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, Math.max(0, percent))}%`,
                                backgroundColor: isLightHex(hex) ? "var(--foreground)" : hex,
                              }}
                            />
                          </div>
                        </div>
                        {spool.notes ? (
                          <p className="mt-2 text-sm leading-5 whitespace-pre-wrap text-muted-foreground">{spool.notes}</p>
                        ) : null}
                        <p className="mt-2 text-xs text-muted-foreground">Added {formatAdded(spool.createdAt)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(spool)}>
                          Edit
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => duplicate(spool)}>
                          Duplicate
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setPendingRemove(spool)}
                        >
                          Remove
                        </Button>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-8 flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>Saved on this computer. Added brands stay in the dropdown.</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setClearOpen(true)}>
              Clear shelf
            </Button>
          </div>
        </>
      )}

      {formMode ? (
        <SpoolFormDialog
          key={editing?.id ?? "create"}
          open
          mode={formMode}
          initial={editing ? draftFromSpool(editing) : emptyDraft()}
          brands={brands}
          onOpenChange={(open) => {
            if (!open) {
              setFormMode(null);
              setEditing(null);
            }
          }}
          onAddBrand={addBrand}
          onSave={saveSpool}
        />
      ) : null}

      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />

      <BrandDialog
        open={brandsOpen}
        brands={brands}
        countForBrand={(brand) =>
          shelfData.spools.filter((spool) => spool.brand.toLowerCase() === brand.toLowerCase()).length
        }
        onOpenChange={setBrandsOpen}
        onAddBrand={addBrand}
        onRemoveBrand={removeBrand}
      />

      <Dialog open={pendingRemove !== null} onOpenChange={(open) => !open && setPendingRemove(null)}>
        <DialogContent className="bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove this spool?</DialogTitle>
            <DialogDescription>
              {pendingRemove
                ? `Remove the ${spoolName(pendingRemove)} spool from this computer. Added brands stay in the list.`
                : "Remove this spool from this computer."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingRemove(null)}>
              Keep it
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => pendingRemove && removeSpool(pendingRemove)}
            >
              Remove spool
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent className="bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear the shelf?</DialogTitle>
            <DialogDescription>
              This removes every spool from this computer. Brands you added stay in the dropdown.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setClearOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={clearShelf}>
              Clear the shelf
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";

import { OptionSelect, type SelectOption } from "@/components/option-select";
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
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  BEST_USES,
  BUILTIN_BRANDS,
  COLORS,
  FILAMENT_TYPES,
  PRINTER_CASES,
  PRINTERS,
  SPOOL_SIZES,
  formatGrams,
  normalizeBrand,
} from "@/lib/catalog";
import { validateDraft, type DraftErrors, type SpoolDraft, type SpoolInput } from "@/lib/inventory";

function options(values: readonly string[]): SelectOption[] {
  return values.map((value) => ({ value, label: value }));
}

export function SpoolFormDialog({
  open,
  mode,
  initial,
  brands,
  onOpenChange,
  onAddBrand,
  onSave,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial: SpoolDraft;
  brands: readonly string[];
  onOpenChange: (open: boolean) => void;
  onAddBrand: (name: string) => string | null;
  onSave: (value: SpoolInput) => void;
}) {
  const [draft, setDraft] = useState<SpoolDraft>(initial);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [addingBrand, setAddingBrand] = useState(false);
  const [brandDraft, setBrandDraft] = useState("");
  const [brandError, setBrandError] = useState<string | null>(null);

  const customBrands = brands.filter(
    (brand) => !BUILTIN_BRANDS.some((builtin) => builtin.toLowerCase() === brand.toLowerCase()),
  );
  const remainingNumber = Number(draft.remainingGrams);
  const sliderValue = Number.isFinite(remainingNumber)
    ? Math.min(Math.max(remainingNumber, 0), draft.spoolGrams)
    : 0;

  function setField<K extends keyof SpoolDraft>(key: K, value: SpoolDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    const errorKey = key === "remainingGrams" ? "remaining" : key;
    setErrors((current) => ({ ...current, [errorKey]: undefined }));
  }

  function changeSpoolSize(nextSize: string) {
    const grams = Number(nextSize);
    setDraft((current) => {
      const previous = String(current.spoolGrams);
      const followFull = current.remainingGrams.trim() === previous;
      const typed = Number(current.remainingGrams);
      const remaining = followFull || !Number.isFinite(typed) ? grams : Math.min(typed, grams);
      return { ...current, spoolGrams: grams, remainingGrams: String(remaining) };
    });
    setErrors((current) => ({ ...current, remaining: undefined }));
  }

  function commitBrand() {
    const error = onAddBrand(brandDraft);
    if (error) {
      setBrandError(error);
      return;
    }
    setField("brand", normalizeBrand(brandDraft));
    setBrandDraft("");
    setBrandError(null);
    setAddingBrand(false);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = validateDraft(draft, brands);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSave(result.value);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,860px)] overflow-y-auto bg-card sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit spool" : "Add a spool"}</DialogTitle>
          <DialogDescription>
            Choose the brand, type, color, best use, printer, and printer case. Notes are optional.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <OptionSelect
                id="field-brand"
                label="Brand"
                value={draft.brand}
                placeholder="Choose a brand"
                error={errors.brand}
                onValueChange={(value) => setField("brand", value)}
                groups={[
                  { label: "Included", options: options(BUILTIN_BRANDS) },
                  { label: "Added by you", options: options(customBrands) },
                ]}
              />
              {addingBrand ? (
                <div className="flex items-start gap-2">
                  <div className="grid flex-1 gap-1">
                    <Label htmlFor="new-brand" className="sr-only">
                      New brand
                    </Label>
                    <Input
                      id="new-brand"
                      value={brandDraft}
                      placeholder="Brand name"
                      autoFocus
                      className="bg-background"
                      onChange={(event) => {
                        setBrandDraft(event.target.value);
                        setBrandError(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          commitBrand();
                        }
                      }}
                    />
                    {brandError ? <p className="text-sm text-destructive">{brandError}</p> : null}
                  </div>
                  <Button type="button" variant="secondary" onClick={commitBrand}>
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setAddingBrand(false);
                      setBrandDraft("");
                      setBrandError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto justify-start px-0"
                  onClick={() => setAddingBrand(true)}
                >
                  Add a brand
                </Button>
              )}
            </div>
            <OptionSelect
              id="field-type"
              label="Type"
              value={draft.type}
              placeholder="Choose a type"
              error={errors.type}
              onValueChange={(value) => setField("type", value)}
              groups={[{ options: options(FILAMENT_TYPES) }]}
            />
            <OptionSelect
              id="field-color"
              label="Color"
              value={draft.color}
              placeholder="Choose a color"
              error={errors.color}
              onValueChange={(value) => setField("color", value)}
              groups={[
                {
                  options: COLORS.map((color) => ({
                    value: color.name,
                    label: color.name,
                    swatch: color.hex,
                  })),
                },
              ]}
            />
            <OptionSelect
              id="field-best-use"
              label="Best use"
              value={draft.bestUse}
              placeholder="Choose a best use"
              error={errors.bestUse}
              onValueChange={(value) => setField("bestUse", value)}
              groups={[{ options: options(BEST_USES) }]}
            />
            <OptionSelect
              id="field-printer"
              label="Printer"
              value={draft.printer}
              placeholder="Choose a printer"
              error={errors.printer}
              onValueChange={(value) => setField("printer", value)}
              groups={[{ options: options(PRINTERS) }]}
            />
            <OptionSelect
              id="field-printer-case"
              label="Printer case"
              value={draft.printerCase}
              placeholder="Choose a printer case"
              error={errors.printerCase}
              onValueChange={(value) => setField("printerCase", value)}
              groups={[{ options: options(PRINTER_CASES) }]}
            />
            <OptionSelect
              id="field-spool-size"
              label="Spool size"
              value={String(draft.spoolGrams)}
              placeholder="Choose a size"
              onValueChange={changeSpoolSize}
              groups={[
                {
                  options: SPOOL_SIZES.map((grams) => ({
                    value: String(grams),
                    label: formatGrams(grams),
                  })),
                },
              ]}
            />
            <div className="grid gap-1.5">
              <Label htmlFor="field-remaining">Left on the spool</Label>
              <Input
                id="field-remaining"
                type="number"
                inputMode="numeric"
                min={0}
                max={draft.spoolGrams}
                step={1}
                value={draft.remainingGrams}
                aria-invalid={Boolean(errors.remaining)}
                className="bg-background"
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => setField("remainingGrams", event.target.value)}
              />
              <Slider
                aria-label="Grams left on the spool"
                min={0}
                max={draft.spoolGrams}
                step={1}
                value={[sliderValue]}
                onValueChange={(value) => setField("remainingGrams", String(value[0] ?? 0))}
              />
              <p className="text-xs text-muted-foreground">
                {Number.isFinite(remainingNumber) && remainingNumber > draft.spoolGrams
                  ? `This spool holds ${formatGrams(draft.spoolGrams)}.`
                  : `${formatGrams(sliderValue)} of ${formatGrams(draft.spoolGrams)}`}
              </p>
              {errors.remaining ? <p className="text-sm text-destructive">{errors.remaining}</p> : null}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="field-notes">Notes</Label>
            <Textarea
              id="field-notes"
              value={draft.notes}
              maxLength={280}
              placeholder="Dry time, AMS slot, nozzle notes"
              className="bg-background"
              onChange={(event) => setField("notes", event.target.value)}
            />
            {errors.notes ? <p className="text-sm text-destructive">{errors.notes}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{mode === "edit" ? "Save changes" : "Save spool"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

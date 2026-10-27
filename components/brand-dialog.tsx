"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BUILTIN_BRANDS, normalizeBrand } from "@/lib/catalog";

export function BrandDialog({
  open,
  brands,
  countForBrand,
  onOpenChange,
  onAddBrand,
  onRemoveBrand,
}: {
  open: boolean;
  brands: readonly string[];
  countForBrand: (brand: string) => number;
  onOpenChange: (open: boolean) => void;
  onAddBrand: (name: string) => string | null;
  onRemoveBrand: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const customBrands = brands.filter(
    (brand) => !BUILTIN_BRANDS.some((builtin) => builtin.toLowerCase() === brand.toLowerCase()),
  );

  function commit() {
    const result = onAddBrand(name);
    if (result) {
      setError(result);
      return;
    }
    setName("");
    setError(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setName("");
          setError(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[min(92vh,720px)] overflow-y-auto bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Brands</DialogTitle>
          <DialogDescription>
            Bambu Lab, Sunlu, Fiberon, Siraya Tech, American Filament, 3DFuel, and Prusament stay in the list.
            Brands you add stay on this computer.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            commit();
          }}
        >
          <Label htmlFor="manage-brand">Add a brand</Label>
          <div className="flex gap-2">
            <Input
              id="manage-brand"
              value={name}
              placeholder="Brand name"
              className="bg-background"
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
            />
            <Button type="submit">Add</Button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
        <ul className="divide-y divide-border border-y">
          {brands.map((brand) => {
            const builtin = BUILTIN_BRANDS.some((item) => item.toLowerCase() === brand.toLowerCase());
            const count = countForBrand(brand);
            return (
              <li key={brand} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">{brand}</p>
                  <p className="text-xs text-muted-foreground">
                    {builtin
                      ? count === 0
                        ? "Included"
                        : `Included · ${count} ${count === 1 ? "spool" : "spools"}`
                      : count === 0
                        ? "Added by you"
                        : `On ${count} ${count === 1 ? "spool" : "spools"}`}
                  </p>
                </div>
                {builtin ? null : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={count > 0}
                    onClick={() => onRemoveBrand(normalizeBrand(brand))}
                  >
                    Remove
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        {customBrands.length === 0 ? (
          <p className="text-sm text-muted-foreground">No extra brands yet.</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

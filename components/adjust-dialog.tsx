"use client";

import { useState } from "react";

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
import { formatGrams } from "@/lib/catalog";
import { parseAdjustmentGrams, type Spool } from "@/lib/inventory";

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Denver",
  }).format(date);
}

export function AdjustDialog({
  spool,
  direction,
  onOpenChange,
  onApply,
}: {
  spool: Spool;
  direction: "add" | "subtract";
  onOpenChange: (open: boolean) => void;
  onApply: (grams: number, reason: string) => string | null;
}) {
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<"g" | "kg">("g");
  const [reason, setReason] = useState(direction === "add" ? "Added filament" : "Used filament");
  const [error, setError] = useState<string | null>(null);
  const adding = direction === "add";

  function apply() {
    const parsed = parseAdjustmentGrams(amount, unit);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    const result = onApply(parsed.grams, reason);
    if (result) setError(result);
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,720px)] overflow-y-auto bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{adding ? "Add filament" : "Subtract filament"}</DialogTitle>
          <DialogDescription>
            {spool.brand} {spool.color.toLowerCase()} {spool.type}. {formatGrams(spool.remainingGrams)} on hand.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            apply();
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="adjust-amount">Amount</Label>
            <div className="flex gap-2">
              <Input
                id="adjust-amount"
                inputMode="decimal"
                value={amount}
                placeholder={unit === "g" ? "1000" : "1"}
                className="bg-background"
                aria-invalid={Boolean(error)}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setError(null);
                }}
              />
              <div className="flex shrink-0 rounded-full border p-0.5">
                {(["g", "kg"] as const).map((choice) => (
                  <Button
                    key={choice}
                    type="button"
                    size="sm"
                    variant={unit === choice ? "default" : "ghost"}
                    className="rounded-full"
                    onClick={() => {
                      setUnit(choice);
                      setError(null);
                    }}
                  >
                    {choice}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="adjust-reason">Reason</Label>
            <Input
              id="adjust-reason"
              value={reason}
              className="bg-background"
              onChange={(event) => {
                setReason(event.target.value);
                setError(null);
              }}
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{adding ? "+ Add" : "− Subtract"}</Button>
          </DialogFooter>
        </form>
        <section className="grid gap-2 border-t border-border pt-3">
          <h3 className="text-sm font-medium">History</h3>
          {spool.adjustments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No adjustments yet.</p>
          ) : (
            <ul className="grid gap-2">
              {spool.adjustments.map((entry) => (
                <li key={entry.id} className="text-sm">
                  <p className="font-medium tabular-nums">
                    {entry.direction === "add" ? "+" : "−"}
                    {formatGrams(entry.grams)}
                  </p>
                  <p className="text-muted-foreground">
                    {formatWhen(entry.at)}
                    {entry.reason ? ` · ${entry.reason}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { appVersion } from "@/lib/version";

export function HelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Help</DialogTitle>
          <DialogDescription>Hardware Patriots spool shelf</DialogDescription>
        </DialogHeader>
        <p className="text-sm font-medium tabular-nums">Version {appVersion}</p>
        <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
          <p>
            Add a spool with its brand, type, color, cost, best use, printer, and filament storage. Bambu Lab uses the
            official color names for each material. The shelf Cost is what those spools cost together.
          </p>
          <p>Brands adds a name that stays in the list on this computer. The built-in brands stay put.</p>
          <p>
            + Add and − Subtract change the grams on hand. The amount can be grams or kilograms, and the total cannot
            go below zero. Each change is saved with the date, time, and reason.
          </p>
          <p>A spool under 20% is marked low. Search and the filters narrow the shelf.</p>
          <p>The shelf is saved on this computer. Nothing is sent to a server.</p>
          <p>
            Changes after the 0.50.1 installers: + Add and − Subtract, a saved history for each change, Bambu Lab’s
            official colors, and a cost on every spool. The full list is in CHANGELOG.md in the project folder.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

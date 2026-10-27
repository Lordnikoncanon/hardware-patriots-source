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
          <p>Add a spool with its brand, type, color, best use, printer, and filament storage.</p>
          <p>Brands adds a name that stays in the list on this computer. The built-in brands stay put.</p>
          <p>A spool under 20% is marked low. Search and the filters narrow the shelf.</p>
          <p>The shelf is saved on this computer. Nothing is sent to a server.</p>
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

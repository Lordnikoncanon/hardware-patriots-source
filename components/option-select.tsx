"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  swatch?: string;
};

export type SelectOptionGroup = {
  label?: string;
  options: SelectOption[];
};

export function OptionSelect({
  id,
  label,
  value,
  onValueChange,
  placeholder,
  groups,
  error,
  triggerClassName,
}: {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  groups: SelectOptionGroup[];
  error?: string;
  triggerClassName?: string;
}) {
  const visibleGroups = groups.filter((group) => group.options.length > 0);

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          id={id}
          aria-invalid={Boolean(error)}
          className={cn("w-full bg-background", triggerClassName)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {visibleGroups.map((group, index) => (
            <SelectGroup key={group.label ?? `group-${index}`}>
              {group.label ? <SelectLabel>{group.label}</SelectLabel> : null}
              {group.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    {option.swatch ? (
                      <span
                        aria-hidden
                        className="size-3.5 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]"
                        style={{ background: option.swatch }}
                      />
                    ) : null}
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

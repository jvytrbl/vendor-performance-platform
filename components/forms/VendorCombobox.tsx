"use client";

import { useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "cmdk";
import type { VendorRecord } from "@/lib/api/vendors";
import { fieldControlClass } from "./fieldClasses";

interface VendorComboboxProps {
  id: string;
  vendors: VendorRecord[];
  value: number | undefined;
  disabled?: boolean;
  placeholder: string;
  error?: string | null;
  onChange: (vendorId: number) => void;
  onBlur: () => void;
}

export default function VendorCombobox({
  id,
  vendors,
  value,
  disabled,
  placeholder,
  error,
  onChange,
  onBlur,
}: VendorComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = vendors.find((vendor) => vendor.id === value);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onBlur();
      }}
    >
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          disabled={disabled}
          className={`${fieldControlClass} justify-between text-left`}
        >
          <span className={selected ? "text-foreground" : "text-foreground-subtle"}>
            {selected?.name ?? placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-foreground-subtle" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded border border-border bg-surface"
        >
          <Command label="Vendors" loop>
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="h-4 w-4 shrink-0 text-foreground-subtle" strokeWidth={1.75} aria-hidden="true" />
              <CommandInput
                placeholder="Search vendors…"
                className="h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-subtle"
              />
            </div>
            <CommandList id={`${id}-list`} className="max-h-60 overflow-y-auto p-1">
              <CommandEmpty className="px-3 py-6 text-center text-sm text-foreground-muted">
                No vendors match.
              </CommandEmpty>
              {vendors.map((vendor) => (
                <CommandItem
                  key={vendor.id}
                  value={vendor.name}
                  onSelect={() => {
                    onChange(vendor.id);
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-center justify-between rounded px-3 py-2 text-sm text-foreground data-[selected=true]:bg-surface-muted"
                >
                  {vendor.name}
                  {vendor.id === value ? (
                    <Check className="h-4 w-4 text-accent" strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <span className="h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

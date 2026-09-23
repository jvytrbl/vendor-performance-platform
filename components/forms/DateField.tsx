"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { format, isValid, parse } from "date-fns";
import { Calendar } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { fieldControlClass } from "./fieldClasses";

interface DateFieldProps {
  id: string;
  value: string;
  error?: string | null;
  onChange: (value: string) => void;
  onBlur: () => void;
}

const calendarStyle = {
  "--rdp-accent-color": "var(--color-accent)",
  "--rdp-accent-background-color": "var(--color-accent-soft)",
  "--rdp-today-color": "var(--color-accent)",
} as CSSProperties;

function toDate(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : undefined;
}

export default function DateField({ id, value, error, onChange, onBlur }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);

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
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${fieldControlClass} justify-between text-left`}
        >
          <span className={selected ? "text-foreground" : "text-foreground-subtle"}>
            {selected ? format(selected, "dd/MM/yyyy") : "dd/mm/yyyy"}
          </span>
          <Calendar className="h-4 w-4 shrink-0 text-foreground-subtle" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 rounded border border-border bg-surface p-3 text-foreground"
        >
          <DayPicker
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              onChange(date ? format(date, "yyyy-MM-dd") : "");
              setOpen(false);
            }}
            style={calendarStyle}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

"use client";

import { useState } from "react";
import { Input } from "@enterprise/design-system";
import { Plus } from "lucide-react";

export interface CategoryComboboxProps {
  value: string;
  onChange: (v: string) => void;
  categories: string[];
  placeholder?: string;
}

export function CategoryCombobox({
  value,
  onChange,
  categories,
  placeholder = "Select or create a category",
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value);
  const filtered = categories.filter((c) =>
    c.toLowerCase().includes(input.toLowerCase()),
  );
  const showCreate =
    input.trim() &&
    !categories.some((c) => c.toLowerCase() === input.trim().toLowerCase());

  return (
    <div className="relative">
      <Input
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
      />
      {open && (filtered.length > 0 || showCreate) && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg py-1 max-h-40 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          {filtered.map((cat) => (
            <button
              key={cat}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setInput(cat);
                onChange(cat);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors ${cat === value ? "bg-primary/10 text-primary font-medium" : ""}`}
            >
              {cat}
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(input.trim());
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-primary hover:bg-primary/5 transition-colors flex items-center gap-1.5 border-t border-border/50"
            >
              <Plus className="w-3.5 h-3.5" />
              Create &quot;{input.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

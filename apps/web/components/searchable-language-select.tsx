"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import styles from "./searchable-language-select.module.css";

type SearchableLanguageSelectProps = {
  id: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
};

export function SearchableLanguageSelect({
  id,
  options,
  value,
  onChange,
}: SearchableLanguageSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          aria-expanded={open}
          aria-haspopup="listbox"
          className={styles.trigger}
          id={id}
          type="button"
        >
          <span>{value || "Select a language"}</span>
          <ChevronsUpDown aria-hidden="true" className={styles.triggerIcon} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          className={styles.content}
          sideOffset={6}
        >
          <Command label="Languages" className={styles.command}>
            <Command.Input
              autoFocus
              className={styles.searchInput}
              placeholder="Search languages…"
              value={search}
              onValueChange={setSearch}
            />
            <Command.List className={styles.list}>
              <Command.Empty className={styles.empty}>
                No language found.
              </Command.Empty>
              {options.map((option) => (
                <Command.Item
                  className={styles.item}
                  key={option}
                  value={option}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    aria-hidden="true"
                    className={styles.check}
                    data-selected={value === option ? "true" : "false"}
                  />
                  <span>{option}</span>
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

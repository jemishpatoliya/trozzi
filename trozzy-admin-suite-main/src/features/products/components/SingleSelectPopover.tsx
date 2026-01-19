import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, X } from "lucide-react";

export type SingleSelectOption = {
  value: string;
  label: string;
  description?: string;
  indent?: number;
  searchValue?: string;
};

type Props = {
  value: string;
  onChange: (next: string) => void;
  options: SingleSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function SingleSelectPopover({ value, onChange, options, placeholder, disabled, className }: Props) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    if (!value) return undefined;
    return options.find((o) => o.value === value);
  }, [options, value]);

  const clear = () => onChange("");

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between" disabled={disabled}>
            <span className={cn("truncate", !value && "text-muted-foreground")}>{
              !value ? placeholder ?? "Select" : selected?.description ?? selected?.label ?? "Select"
            }</span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No results</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="max-h-72">
                  <div className="p-1">
                    {options.map((o) => {
                      const isSelected = value === o.value;
                      return (
                        <CommandItem
                          key={o.value}
                          value={o.searchValue ?? `${o.label} ${o.description ?? ""}`}
                          onSelect={() => onChange(o.value)}
                          className="flex items-start gap-3"
                        >
                          <Checkbox checked={isSelected} className="mt-0.5" />
                          <div className="min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ paddingLeft: `${(o.indent ?? 0) * 12}px` }}
                            >
                              {o.label}
                            </p>
                            {o.description ? <p className="text-xs text-muted-foreground truncate">{o.description}</p> : null}
                          </div>
                        </CommandItem>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CommandGroup>
            </CommandList>
            <div className="flex items-center justify-between border-t px-3 py-2">
              <Button type="button" size="sm" variant="ghost" onClick={clear} disabled={disabled || !value}>
                Clear
              </Button>
              <Button type="button" size="sm" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      {!selected ? null : (
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1 pr-1">
            <span className="truncate max-w-[16rem]">{selected.description ?? selected.label}</span>
            <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={clear} disabled={disabled}>
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        </div>
      )}
    </div>
  );
}

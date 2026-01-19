import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, X } from "lucide-react";

export type MultiSelectOption = {
  value: string;
  label: string;
  description?: string;
  indent?: number;
};

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function MultiSelectPopover({ value, onChange, options, placeholder, disabled, className }: Props) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o] as const));
    return value.map((v) => map.get(v)).filter(Boolean) as MultiSelectOption[];
  }, [options, value]);

  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  };

  const clear = () => onChange([]);

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between" disabled={disabled}>
            <span className={cn("truncate", value.length === 0 && "text-muted-foreground")}>
              {value.length === 0 ? placeholder ?? "Select" : `${value.length} selected`}
            </span>
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
                      const checked = value.includes(o.value);
                      return (
                        <CommandItem
                          key={o.value}
                          value={`${o.label} ${o.description ?? ""}`}
                          onSelect={() => toggle(o.value)}
                          className="flex items-start gap-3"
                        >
                          <Checkbox checked={checked} className="mt-0.5" />
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
              <Button type="button" size="sm" variant="ghost" onClick={clear} disabled={disabled || value.length === 0}>
                Clear
              </Button>
              <Button type="button" size="sm" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="flex flex-wrap gap-2">
        {selected.length === 0 ? null :
          selected.map((o) => (
            <Badge key={o.value} variant="secondary" className="gap-1 pr-1">
              <span className="truncate max-w-[16rem]">{o.label}</span>
              <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => toggle(o.value)} disabled={disabled}>
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
      </div>
    </div>
  );
}

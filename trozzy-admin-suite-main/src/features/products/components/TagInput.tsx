import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  normalize?: (raw: string) => string;
};

export function TagInput({ value, onChange, placeholder, disabled, className, normalize }: Props) {
  const [draft, setDraft] = useState("");

  const normalized = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of value) {
      const n = (normalize ? normalize(v) : v).trim();
      if (!n) continue;
      if (seen.has(n.toLowerCase())) continue;
      seen.add(n.toLowerCase());
      out.push(n);
    }
    return out;
  }, [normalize, value]);

  const commit = () => {
    const n = (normalize ? normalize(draft) : draft).trim();
    if (!n) return;
    if (normalized.some((x) => x.toLowerCase() === n.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...normalized, n]);
    setDraft("");
  };

  const remove = (v: string) => {
    onChange(normalized.filter((x) => x !== v));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === ",") {
              e.preventDefault();
              commit();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={commit} disabled={disabled || !draft.trim()}>
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {normalized.length === 0 ? (
          <p className="text-sm text-muted-foreground">No values added</p>
        ) : (
          normalized.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1 pr-1">
              <span className="truncate max-w-[18rem]">{v}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => remove(v)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}

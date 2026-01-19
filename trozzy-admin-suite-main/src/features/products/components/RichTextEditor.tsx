import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bold, Italic, Link2, List, ListOrdered, Underline } from "lucide-react";

type Props = {
  value: string;
  onChange: (nextHtml: string) => void;
  className?: string;
  disabled?: boolean;
};

function exec(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function RichTextEditor({ value, onChange, className, disabled }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  const sync = () => {
    const html = ref.current?.innerHTML ?? "";
    onChange(html);
  };

  return (
    <div className={cn("rounded-xl border bg-card overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-3 py-2">
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("bold")} disabled={disabled}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("italic")} disabled={disabled}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("underline")} disabled={disabled}>
          <Underline className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("insertUnorderedList")} disabled={disabled}>
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("insertOrderedList")} disabled={disabled}>
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled}
          onClick={() => {
            const url = window.prompt("Enter link URL");
            if (!url) return;
            exec("createLink", url);
            sync();
          }}
        >
          <Link2 className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={ref}
        className={cn(
          "min-h-[180px] px-4 py-3 text-sm leading-relaxed outline-none",
          "prose prose-sm dark:prose-invert max-w-none",
          disabled && "pointer-events-none opacity-60",
        )}
        contentEditable={!disabled}
        onInput={sync}
        onBlur={sync}
        suppressContentEditableWarning
      />
    </div>
  );
}

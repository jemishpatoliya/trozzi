import { useEffect } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

type Props = {
  name: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  className?: string;
};

export function KeyValueTable({ name, keyPlaceholder, valuePlaceholder, className }: Props) {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });

  useEffect(() => {
    if (fields.length === 0) {
      append({ key: "", value: "" });
    }
  }, [append, fields.length]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ key: "", value: "" })}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add row
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[38%]">Key</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((f, idx) => {
              const canRemove = fields.length > 1;
              return (
                <TableRow key={(f as any).id ?? idx} className="align-top">
                  <TableCell>
                    <Input
                      placeholder={keyPlaceholder ?? "e.g. Processor"}
                      {...register(`${name}.${idx}.key`)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder={valuePlaceholder ?? "e.g. M2"}
                      {...register(`${name}.${idx}.value`)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(idx)}
                      disabled={!canRemove}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DrilldownColumn<T> {
  key: keyof T;
  label: string;
  format?: (v: T[keyof T], row: T) => string;
  align?: "left" | "right";
}

interface DrilldownTableProps<T> {
  columns: DrilldownColumn<T>[];
  rows: T[];
  emptyMessage?: string;
}

export function DrilldownTable<T extends Record<string, unknown>>({
  columns,
  rows,
  emptyMessage = "Nenhum registro encontrado.",
}: DrilldownTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead
                key={String(c.key)}
                className={c.align === "right" ? "text-right" : ""}
              >
                {c.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {columns.map((c) => {
                const raw = row[c.key];
                const value = c.format ? c.format(raw as T[keyof T], row) : String(raw ?? "");
                return (
                  <TableCell
                    key={String(c.key)}
                    className={c.align === "right" ? "text-right tabular-nums" : ""}
                  >
                    {value}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

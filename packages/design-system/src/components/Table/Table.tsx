import * as React from "react";
import type { TableProps } from "../../types";

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  emptyMessage = "No data",
  onRowClick,
  className = "",
}: TableProps<T>) {
  return (
    <div className={`w-full overflow-auto rounded-md border ${className}`}>
      <table className="w-full caption-bottom text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className="h-10 px-4 text-left align-middle font-medium text-muted-foreground"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className="border-b transition-colors hover:bg-muted/50"
                onClick={() => onRowClick?.(row)}
                role={onRowClick ? "button" : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className="p-4 align-middle">
                    {col.render
                      ? col.render((row as Record<string, unknown>)[col.key], row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

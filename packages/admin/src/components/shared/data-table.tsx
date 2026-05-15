 "use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@enterprise/design-system/table";
import {
  Search,
  LayoutGrid,
  Filter,
  Database,
  Rows3,
  Rows2,
  AlignJustify,
} from "lucide-react";

import {
  Button,
  Input,
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Label,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@enterprise/design-system";

export interface DataTablePaginationMeta {
  page: number;
  pageCount: number;
  total: number;
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  loading?: boolean;
  /** Column id for text search/filtering */
  searchColumn?: string;
  searchPlaceholder?: string;
  paginationMeta?: DataTablePaginationMeta | null;
  onPageChange?: (page: number) => void;
  /** Initial column visibility (column id -> boolean) */
  initialColumnVisibility?: VisibilityState;
  /** Called when user changes column visibility (for persistence) */
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  /**
   * Fires whenever the row selection changes. Receives the underlying rows
   * of the currently-selected items so the parent can render a bulk action
   * toolbar without re-implementing the checkbox logic.
   */
  onSelectionChange?: (selected: TData[]) => void;
}

type Density = "compact" | "comfortable" | "spacious";

const DENSITY_STORAGE_KEY = "enterprise.dataTable.density";

const DENSITY_CONFIG: Record<
  Density,
  { label: string; icon: React.ComponentType<{ className?: string }>; cellPy: string; rowH: string }
> = {
  compact: { label: "Compact", icon: AlignJustify, cellPy: "py-1", rowH: "" },
  comfortable: { label: "Comfortable", icon: Rows3, cellPy: "py-3", rowH: "" },
  spacious: { label: "Spacious", icon: Rows2, cellPy: "py-5", rowH: "" },
};

function readDensity(): Density {
  if (typeof window === "undefined") return "comfortable";
  const v = window.localStorage.getItem(DENSITY_STORAGE_KEY);
  return v === "compact" || v === "spacious" || v === "comfortable"
    ? v
    : "comfortable";
}

export function DataTable<TData>({
  columns,
  data,
  loading,
  searchColumn,
  searchPlaceholder,
  paginationMeta,
  onPageChange,
  initialColumnVisibility = {},
  onColumnVisibilityChange,
  onSelectionChange,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialColumnVisibility);
  const [rowSelection, setRowSelection] = React.useState({});
  const [density, setDensityState] = React.useState<Density>("comfortable");

  // Hydrate density from localStorage on mount so SSR + first paint match,
  // then persist on change.
  React.useEffect(() => {
    setDensityState(readDensity());
  }, []);
  const setDensity = (d: Density) => {
    setDensityState(d);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DENSITY_STORAGE_KEY, d);
    }
  };
  const densityCellPy = DENSITY_CONFIG[density].cellPy;


  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility((prev) => {
        const next = typeof updater === "function" ? updater(prev) : prev;
        onColumnVisibilityChange?.(next);
        return next;
      });
    },
    onRowSelectionChange: (updater) => {
      setRowSelection((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        return next;
      });
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Bubble up the selected rows whenever the in-memory map changes. We do
  // this in an effect so consumers don't need to wire up tanstack-table's
  // updater type directly.
  React.useEffect(() => {
    if (!onSelectionChange) return;
    const rows = table.getSelectedRowModel().rows.map((r) => r.original);
    onSelectionChange(rows);
    // table reference is stable per render
  }, [rowSelection, onSelectionChange, table]);

  const meta = paginationMeta ?? undefined;

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-border/50 bg-muted/10 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-9 bg-background/50 border-input/50 focus-visible:ring-primary/30"
            value={
              (searchColumn &&
                (table
                  .getColumn(searchColumn)
                  ?.getFilterValue() as string)) ??
              ""
            }
            onChange={(event) =>
              searchColumn &&
              table
                .getColumn(searchColumn)
                ?.setFilterValue(event.target.value)
            }
          />
        </div>
        <div className="flex gap-2 items-center">
          {/* Per-column filter popover. Lets the user narrow each filterable
              column without leaving the table view — every input maps to
              tanstack's column.setFilterValue. */}
          <Popover>
            <PopoverTrigger
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs h-8 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer aria-expanded:bg-accent aria-expanded:text-foreground">
              <Filter className="w-4 h-4" /> Filters
              {columnFilters.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold tabular-nums">
                  {columnFilters.length}
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Filter columns</p>
                {columnFilters.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setColumnFilters([])}>
                    Clear all
                  </button>
                )}
              </div>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {table
                  .getAllLeafColumns()
                  .filter((c) => c.getCanFilter() && c.getIsVisible())
                  .map((column) => (
                    <div key={column.id} className="space-y-1">
                      <Label
                        htmlFor={`filter-${column.id}`}
                        className="capitalize text-xs">
                        {column.id}
                      </Label>
                      <Input
                        id={`filter-${column.id}`}
                        value={(column.getFilterValue() as string) ?? ""}
                        onChange={(e) =>
                          column.setFilterValue(e.target.value || undefined)
                        }
                        placeholder={`Search ${column.id}…`}
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                {table
                  .getAllLeafColumns()
                  .filter((c) => c.getCanFilter() && c.getIsVisible())
                  .length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No filterable columns are visible. Toggle columns from the
                    Columns menu first.
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Density toggle — Strapi-style cycle through compact /
              comfortable / spacious. Persisted to localStorage so the
              choice survives reloads. */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs h-8 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
                onClick={() => {
                  const order: Density[] = [
                    "compact",
                    "comfortable",
                    "spacious",
                  ];
                  const next =
                    order[(order.indexOf(density) + 1) % order.length];
                  setDensity(next);
                }}>
                {React.createElement(DENSITY_CONFIG[density].icon, {
                  className: "w-4 h-4",
                })}
                <span className="hidden md:inline">
                  {DENSITY_CONFIG[density].label}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>Density — click to switch</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs h-8 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer aria-expanded:bg-accent aria-expanded:text-foreground"
            >
              <LayoutGrid className="w-4 h-4" />
              Columns
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => {
                      column.toggleVisibility(!!value);
                    }}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <TableRoot>
          <TableHeader className="bg-muted/30 sticky top-0 z-10 shadow-sm">
            <TableRow className="border-b-border/50 hover:bg-transparent">
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="font-semibold text-foreground whitespace-nowrap"
                  >
                    {header.isPlaceholder ? null : (
                      <>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </>
                    )}
                  </TableHead>
                )),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(5)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    {table.getAllColumns().map((column) => (
                      <TableCell key={column.id} className={densityCellPy}>
                        <div className="h-4 bg-muted/50 rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-full text-center py-20"
                >
                  <div className="flex flex-col items-center justify-center text-muted-foreground max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center mb-4">
                      <Database className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-lg font-medium text-foreground mb-1">
                      No results
                    </p>
                    <p className="text-sm">
                      Try adjusting your filters or create a new entry.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className="group hover:bg-muted/30 border-border/30 transition-all duration-200 cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={`max-w-[240px] truncate ${densityCellPy}`}
                    >
                      <>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </TableRoot>
      </div>

      {meta && (
        <div className="p-4 border-t border-border/50 bg-muted/10 flex items-center justify-between text-sm text-muted-foreground gap-4 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <p>
              <span className="font-medium text-foreground">
                {table.getFilteredSelectedRowModel().rows.length}
              </span>{" "}
            of{" "}
              <span className="font-medium text-foreground">
                {table.getFilteredRowModel().rows.length}
              </span>{" "}
              row(s) selected
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="hidden sm:inline">
              Showing{" "}
              <span className="font-medium text-foreground">
                {data.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {meta.total}
              </span>{" "}
              entries
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page === 1}
                className="h-8"
                onClick={() => onPageChange?.(meta.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.pageCount}
                className="h-8"
                onClick={() => onPageChange?.(meta.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


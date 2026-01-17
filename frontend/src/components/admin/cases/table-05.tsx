"use client";

import { useState, useEffect, useRef } from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Case, CasePriority, CaseStatus } from "@/types/cases";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Status = CasePriority | CaseStatus;

const priorityConfig: Record<
  CasePriority,
  { label: string; className: string }
> = {
  low: {
    label: "Low",
    className:
      "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  medium: {
    label: "Medium",
    className:
      "bg-amber-500/15 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  },
  high: {
    label: "High",
    className:
      "bg-orange-500/15 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  },
  critical: {
    label: "Critical",
    className:
      "bg-red-500/15 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  },
};

const statusConfig: Record<CaseStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className:
      "bg-slate-500/15 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400",
  },
  assigned: {
    label: "Assigned",
    className:
      "bg-blue-500/15 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  },
  under_investigation: {
    label: "Under Investigation",
    className:
      "bg-purple-500/15 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  },
  verified: {
    label: "Verified",
    className:
      "bg-green-500/15 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  },
  closed: {
    label: "Closed",
    className:
      "bg-gray-500/15 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400",
  },
  archived: {
    label: "Archived",
    className:
      "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  },
};

function PriorityBadge({ priority }: { priority: CasePriority }) {
  const config = priorityConfig[priority];
  return (
    <Badge variant="outline" className={cn("border-0", config?.className)}>
      {config?.label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: CaseStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("border-0", config?.className)}>
      {config?.label}
    </Badge>
  );
}

const columns: ColumnDef<Case>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        className="bg-background"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        className="bg-background"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "case_number",
    header: "Case Number",
    cell: ({ row }) => (
      <span className="font-medium font-mono">
        {row.getValue("case_number")}
      </span>
    ),
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="max-w-xs truncate">{row.getValue("title")}</span>
    ),
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => <PriorityBadge priority={row.getValue("priority")} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return <span>{date.toLocaleDateString()}</span>;
    },
  },
  {
    accessorKey: "assignedTo",
    header: "Assigned To",
    cell: ({ row }) => {
      const assignedTo = row.original.assigned_to_name;
      return (
        <span className="text-sm">
          {assignedTo ? (
            <span className="text-muted-foreground">{assignedTo}</span>
          ) : (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const caseData = row.original;
      const meta = table.options.meta as {
        onViewCase: (caseData: Case) => void;
        onEditCase: (caseData: Case) => void;
        onDeleteCase: (id: string) => void;
      };

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => meta?.onViewCase(caseData)}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => meta?.onEditCase(caseData)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => meta?.onDeleteCase(caseData.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export default function Table05({
  onViewCase,
  onEditCase,
  onDeleteCase,
}: {
  onViewCase: (caseData: Case) => void;
  onEditCase: (caseData: Case) => void;
  onDeleteCase: (id: string) => void;
}) {
  const [data, setData] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilters, setStatusFilters] = useState<CaseStatus | "all">("all");
  const [pageIndex, setPageIndex] = useState(0);
  const tableRef = useRef<any>(null);

  // Fetch cases from API
  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      setError(null);
      try {
        const url =
          statusFilters === "all"
            ? `${API_URL}/cases`
            : `${API_URL}/cases?status=${statusFilters}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch cases");
        const cases = await res.json();
        console.log("fetched cases", cases);
        setData(cases);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [statusFilters]);

  const filteredData = data;

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      rowSelection,
      globalFilter,
      pagination: {
        pageIndex,
        pageSize: 10,
      },
    },
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize: 10 })
          : updater;
      setPageIndex(newPagination.pageIndex);
    },
    meta: {
      onViewCase,
      onEditCase,
      onDeleteCase,
    },
  });

  tableRef.current = table;

  // Reset page when filter changes
  useEffect(() => {
    setPageIndex(0);
  }, [statusFilters]);

  const pageCount = table.getPageCount();
  const currentPage = pageIndex + 1;

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className=" w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Select
          value={statusFilters}
          onValueChange={(value) =>
            setStatusFilters(value as CaseStatus | "all")
          }
        >
          <SelectTrigger className="h-8 w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="under_investigation">
              Under Investigation
            </SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="h-8 w-full sm:w-64"
        />
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                className="bg-muted hover:bg-muted"
                key={headerGroup.id}
              >
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}{" "}
          to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length,
          )}{" "}
          of {table.getFilteredRowModel().rows.length} entries
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(page - 1)}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

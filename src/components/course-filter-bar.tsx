"use client";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CourseSortField, SortOrder } from "@/lib/api";

const selectClassName =
  "h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

interface SortOption {
  value: CourseSortField;
  label: string;
  order: SortOrder;
}

const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { value: "date", label: "Newest first", order: "desc" },
  { value: "name", label: "Name (A-Z)", order: "asc" },
];

export function CourseFilterBar({
  searchPlaceholder,
  search,
  onSearchChange,
  sort,
  order,
  onSortChange,
  sortOptions = DEFAULT_SORT_OPTIONS,
  statusFilter,
  onStatusFilterChange,
  className,
}: {
  searchPlaceholder: string;
  search: string;
  onSearchChange: (value: string) => void;
  sort: CourseSortField;
  order: SortOrder;
  onSortChange: (sort: CourseSortField, order: SortOrder) => void;
  sortOptions?: SortOption[];
  statusFilter?: "all" | "in_progress" | "completed";
  onStatusFilterChange?: (value: "all" | "in_progress" | "completed") => void;
  className?: string;
}) {
  const selectedKey = `${sort}:${order}`;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="relative min-w-[160px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-7"
          aria-label={searchPlaceholder}
        />
      </div>

      {onStatusFilterChange && (
        <select
          className={selectClassName}
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as "all" | "in_progress" | "completed")}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      )}

      <select
        className={selectClassName}
        value={selectedKey}
        onChange={(e) => {
          const [nextSort, nextOrder] = e.target.value.split(":") as [CourseSortField, SortOrder];
          onSortChange(nextSort, nextOrder);
        }}
        aria-label="Sort courses"
      >
        {sortOptions.map((opt) => (
          <option key={`${opt.value}:${opt.order}`} value={`${opt.value}:${opt.order}`}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

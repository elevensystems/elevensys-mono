'use client';

import type { ReactNode } from 'react';

import { cn } from '@workspace/ui/lib/utils';

export interface Column<T> {
  label: string;
  align?: 'left' | 'right' | 'center';
  render: (row: T, index: number) => ReactNode;
  /** Allow the cell to wrap instead of truncating on one line. */
  wrap?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  /** Minimum table width (px) before horizontal scroll kicks in. */
  minWidth?: number;
  emptyMessage?: string;
}

const alignClass = (align?: 'left' | 'right' | 'center') =>
  align === 'right'
    ? 'text-right'
    : align === 'center'
      ? 'text-center'
      : 'text-left';

export function DataTable<T>({
  columns,
  rows,
  onRowClick,
  minWidth,
  emptyMessage = 'No data in range',
}: DataTableProps<T>) {
  return (
    <div className="bg-card overflow-x-auto rounded-xl border">
      <table
        className="w-full border-collapse text-[12.5px]"
        style={{ minWidth }}
      >
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th
                key={i}
                className={cn(
                  'bg-muted/40 text-muted-foreground sticky top-0 whitespace-nowrap border-b px-3.5 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider',
                  alignClass(c.align)
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-muted-foreground px-3.5 py-8 text-center"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, ri) => (
              <tr
                key={ri}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  ri < rows.length - 1 && 'border-b',
                  onRowClick &&
                    'hover:bg-muted/50 cursor-pointer transition-colors'
                )}
              >
                {columns.map((c, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      'px-3.5 py-2.5 align-middle',
                      c.wrap ? 'whitespace-normal' : 'whitespace-nowrap',
                      alignClass(c.align)
                    )}
                  >
                    {c.render(row, ri)}
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

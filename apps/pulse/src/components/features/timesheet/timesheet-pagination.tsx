'use client';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@workspace/ui/components/pagination';

interface TimesheetPaginationProps {
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function TimesheetPagination({
  currentPage,
  totalPages,
  isLoading,
  onPageChange,
}: TimesheetPaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <div className="flex justify-end mt-4">
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={
                hasPrevPage && !isLoading
                  ? () => onPageChange(currentPage - 1)
                  : undefined
              }
              aria-disabled={!hasPrevPage || isLoading}
              className={
                !hasPrevPage || isLoading
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>
          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNum = i + 1;
            const isFirst = i === 0;
            const isLast = i === totalPages - 1;
            const isNearCurrent = Math.abs(pageNum - currentPage) <= 1;

            if (!isFirst && !isLast && !isNearCurrent) {
              const prevShown =
                i === 1
                  ? true
                  : i - 1 === 0 ||
                    i - 1 === totalPages - 1 ||
                    Math.abs(i - currentPage) <= 1;
              if (prevShown) {
                return (
                  <PaginationItem key={i}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              return null;
            }

            return (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={pageNum === currentPage}
                  onClick={() => onPageChange(pageNum)}
                  className="cursor-pointer"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          <PaginationItem>
            <PaginationNext
              onClick={
                hasNextPage && !isLoading
                  ? () => onPageChange(currentPage + 1)
                  : undefined
              }
              aria-disabled={!hasNextPage || isLoading}
              className={
                !hasNextPage || isLoading
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

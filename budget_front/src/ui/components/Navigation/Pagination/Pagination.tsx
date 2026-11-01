// frontend/src/ui/components/Navigation/Pagination/Pagination.tsx
import { Icon } from '@/ui/components/Base/Icon';
import { BaseComponentProps } from '@/ui/types';
import { useMemo } from 'react';
import { PaginationButton } from './PaginationButton';
import { PaginationContainer } from './PaginationContainer';
import { PaginationEllipsis } from './PaginationEllipsis';
import { PaginationItem } from './PaginationItem';

export interface PaginationProps extends BaseComponentProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  disabled?: boolean;
}

const range = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

const BasePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  disabled = false,
  ...rest
}: PaginationProps) => {
  const paginationRange = useMemo(() => {
    const totalPageNumbers = siblingCount + 5;

    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      return [...range(1, leftItemCount), 'DOTS', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      return [1, 'DOTS', ...range(totalPages - rightItemCount + 1, totalPages)];
    }

    return [1, 'DOTS', ...range(leftSiblingIndex, rightSiblingIndex), 'DOTS', totalPages];
  }, [totalPages, siblingCount, currentPage]);

  if (totalPages <= 1) return null;

  return (
    <PaginationContainer {...rest}>
      {showFirstLast && (
        <PaginationItem>
          <PaginationButton
            disabled={disabled || currentPage === 1}
            onClick={() => onPageChange(1)}
            aria-label="Première page"
          >
            <Icon name="chevron-double-left" size={16} />
          </PaginationButton>
        </PaginationItem>
      )}

      <PaginationItem>
        <PaginationButton
          disabled={disabled || currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Page précédente"
        >
          <Icon name="chevron-left" size={16} />
        </PaginationButton>
      </PaginationItem>

      {paginationRange.map((pageNumber, idx) => {
        if (pageNumber === 'DOTS') {
          return (
            <PaginationItem key={`dots-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          );
        }

        const page = pageNumber as number;
        return (
          <PaginationItem key={page}>
            <PaginationButton
              isActive={page === currentPage}
              disabled={disabled}
              onClick={() => onPageChange(page)}
              aria-label={`Page ${page}`}
            >
              {page}
            </PaginationButton>
          </PaginationItem>
        );
      })}

      <PaginationItem>
        <PaginationButton
          disabled={disabled || currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Page suivante"
        >
          <Icon name="chevron-right" size={16} />
        </PaginationButton>
      </PaginationItem>

      {showFirstLast && (
        <PaginationItem>
          <PaginationButton
            disabled={disabled || currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
            aria-label="Dernière page"
          >
            <Icon name="chevron-double-right" size={16} />
          </PaginationButton>
        </PaginationItem>
      )}
    </PaginationContainer>
  );
};

export const Pagination = Object.assign(BasePagination, {
  Container: PaginationContainer,
  Item: PaginationItem,
  Button: PaginationButton,
  Ellipsis: PaginationEllipsis,
});

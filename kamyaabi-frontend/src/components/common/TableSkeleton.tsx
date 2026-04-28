import { Skeleton, TableCell, TableRow } from '@mui/material';

interface TableSkeletonProps {
  rows?: number;
  columns: number;
}

/**
 * Renders a placeholder block of {@code rows × columns} cells while an admin
 * list is loading. Keeps perceived latency low and prevents layout jumps when
 * data finally arrives.
 */
const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns }) => (
  <>
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <TableRow key={`sk-row-${rowIdx}`}>
        {Array.from({ length: columns }).map((__, colIdx) => (
          <TableCell key={`sk-cell-${rowIdx}-${colIdx}`}>
            <Skeleton variant="text" />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

export default TableSkeleton;

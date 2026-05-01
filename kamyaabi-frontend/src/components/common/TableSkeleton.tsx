import { Skeleton, TableCell, TableRow } from '@mui/material';

interface TableSkeletonProps {
  rows?: number;
  columns: number;
}

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

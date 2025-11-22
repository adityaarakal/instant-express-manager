import { TableRow, TableCell, Skeleton } from '@mui/material';

interface TableSkeletonProps {
  rows?: number;
  columns: number;
}

export function TableSkeleton({ rows = 5, columns }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={`skeleton-row-${rowIndex}`}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <TableCell 
              key={`skeleton-cell-${rowIndex}-${colIndex}`}
              sx={{
                padding: { xs: '8px 4px', sm: '16px' },
              }}
            >
              <Skeleton 
                variant="text" 
                width="100%" 
                sx={{
                  height: { xs: 20, sm: 24 },
                }}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}


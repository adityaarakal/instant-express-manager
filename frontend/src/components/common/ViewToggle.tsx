import { IconButton, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import TableViewIcon from '@mui/icons-material/TableView';
import ViewModuleIcon from '@mui/icons-material/ViewModule';

type ViewMode = 'table' | 'card';

type ViewToggleProps = {
  viewMode: ViewMode;
  onToggle: () => void;
  'aria-label'?: string;
};

export function ViewToggle({ viewMode, onToggle, 'aria-label': ariaLabel }: ViewToggleProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const isTableView = viewMode === 'table';

  return (
    <Tooltip title={isTableView ? 'Switch to card view' : 'Switch to table view'}>
      <IconButton
        onClick={onToggle}
        aria-label={ariaLabel || (isTableView ? 'Switch to card view' : 'Switch to table view')}
        sx={{
          minWidth: { xs: 48, sm: 40 },
          minHeight: { xs: 48, sm: 40 },
          p: { xs: 1, sm: 0.5 },
        }}
      >
        {isTableView ? (
          <ViewModuleIcon fontSize={isMobile ? 'medium' : 'small'} />
        ) : (
          <TableViewIcon fontSize={isMobile ? 'medium' : 'small'} />
        )}
      </IconButton>
    </Tooltip>
  );
}


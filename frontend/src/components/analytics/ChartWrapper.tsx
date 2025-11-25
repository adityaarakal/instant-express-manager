import { ReactNode, useState } from 'react';
import { Paper, Typography, Box, IconButton, Tooltip, Menu, MenuItem } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ImageIcon from '@mui/icons-material/Image';
import { exportChartAsPNG, exportChartAsSVG } from '../../utils/chartExport';

interface ChartWrapperProps {
  title: string;
  chartId: string;
  children: ReactNode;
  showExport?: boolean;
  height?: number;
  emptyMessage?: string;
  hasData?: boolean;
}

/**
 * Unified chart wrapper component with consistent export functionality
 * and enhanced tooltip support
 */
export function ChartWrapper({
  title,
  chartId,
  children,
  showExport = true,
  height = 300,
  emptyMessage = 'No data available',
  hasData = true,
}: ChartWrapperProps) {
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExportPNG = async () => {
    try {
      await exportChartAsPNG(chartId, `${title.toLowerCase().replace(/\s+/g, '-')}-chart`);
      handleExportMenuClose();
    } catch (error) {
      console.error('Failed to export chart as PNG:', error);
    }
  };

  const handleExportSVG = () => {
    try {
      exportChartAsSVG(chartId, `${title.toLowerCase().replace(/\s+/g, '-')}-chart`);
      handleExportMenuClose();
    } catch (error) {
      console.error('Failed to export chart as SVG:', error);
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        {showExport && hasData && (
          <Box>
            <Tooltip title="Export chart">
              <IconButton
                size="small"
                onClick={handleExportMenuOpen}
                aria-label="Export chart"
                sx={{ minWidth: 40, minHeight: 40 }}
              >
                <FileDownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={handleExportMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleExportPNG}>
                <ImageIcon fontSize="small" sx={{ mr: 1 }} />
                Export as PNG
              </MenuItem>
              <MenuItem onClick={handleExportSVG}>
                <ImageIcon fontSize="small" sx={{ mr: 1 }} />
                Export as SVG
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Box>
      <Box id={chartId} sx={{ height, width: '100%' }}>
        {hasData ? (
          children
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {emptyMessage}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

/**
 * Enhanced tooltip formatter for currency values
 */
export function formatCurrencyTooltip(value: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Enhanced tooltip formatter for percentage values
 */
export function formatPercentageTooltip(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Custom tooltip component for Recharts with enhanced formatting
 * Compatible with Recharts Tooltip component API
 */
export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    dataKey?: string;
    color?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string;
  formatter?: (value: number, name: string) => [string, string];
  currency?: string;
}

export function CustomTooltip({
  active,
  payload,
  label,
  formatter,
  currency = 'INR',
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        padding: 1.5,
        boxShadow: 2,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {label}
      </Typography>
      {payload.map((entry, index) => {
        const value = typeof entry.value === 'number' ? entry.value : parseFloat(String(entry.value || 0));
        const name = entry.name ?? entry.dataKey ?? 'Value';
        const displayValue = formatter
          ? formatter(value, name)[0]
          : formatCurrencyTooltip(value, currency);
        const displayName = formatter ? formatter(value, name)[1] : name;

        return (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                backgroundColor: entry.color || '#8884d8',
                borderRadius: '50%',
              }}
            />
            <Typography variant="body2">
              <strong>{displayName}:</strong> {displayValue}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}


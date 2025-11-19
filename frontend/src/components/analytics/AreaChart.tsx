import { memo } from 'react';
import { Paper, Typography, Box, IconButton, Tooltip } from '@mui/material';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { exportChartAsPNG, exportChartAsSVG } from '../../utils/chartExport';

interface AreaChartData {
  [key: string]: string | number;
}

interface AreaChartProps {
  data: AreaChartData[];
  title: string;
  chartId: string;
  xAxisKey: string;
  areas: Array<{ dataKey: string; name: string; color: string }>;
  showExport?: boolean;
}

export const AreaChart = memo(function AreaChart({
  data,
  title,
  chartId,
  xAxisKey,
  areas,
  showExport = true,
}: AreaChartProps) {
  const handleExportPNG = async () => {
    try {
      await exportChartAsPNG(chartId, `${title.toLowerCase().replace(/\s+/g, '-')}-area-chart`);
    } catch (error) {
      console.error('Failed to export chart:', error);
    }
  };

  const handleExportSVG = () => {
    try {
      exportChartAsSVG(chartId, `${title.toLowerCase().replace(/\s+/g, '-')}-area-chart`);
    } catch (error) {
      console.error('Failed to export chart:', error);
    }
  };

  if (data.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No data available
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        {showExport && (
          <Box>
            <Tooltip title="Export as PNG">
              <IconButton size="small" onClick={handleExportPNG} aria-label="Export as PNG">
                <FileDownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export as SVG">
              <IconButton size="small" onClick={handleExportSVG} aria-label="Export as SVG">
                <FileDownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
      <Box id={chartId} sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart data={data}>
            <defs>
              {areas.map((area) => (
                <linearGradient key={area.dataKey} id={`color${area.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={area.color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={area.color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <RechartsTooltip
              formatter={(value: number) => [
                new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  minimumFractionDigits: 2,
                }).format(value),
                'Amount',
              ]}
            />
            <Legend />
            {areas.map((area) => (
              <Area
                key={area.dataKey}
                type="monotone"
                dataKey={area.dataKey}
                stroke={area.color}
                fill={`url(#color${area.dataKey})`}
                name={area.name}
              />
            ))}
          </RechartsAreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
});


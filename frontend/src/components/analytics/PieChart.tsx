import { useMemo, memo } from 'react';
import { Paper, Typography, Box, IconButton, Tooltip } from '@mui/material';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
  type PieLabelRenderProps,
} from 'recharts';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { exportChartAsPNG, exportChartAsSVG } from '../../utils/chartExport';

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartData[];
  title: string;
  chartId: string;
  showExport?: boolean;
}

const DEFAULT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const PieChart = memo(function PieChart({ data, title, chartId, showExport = true }: PieChartProps) {
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    }));
  }, [data]);

  const handleExportPNG = async () => {
    try {
      await exportChartAsPNG(chartId, `${title.toLowerCase().replace(/\s+/g, '-')}-pie-chart`);
    } catch (error) {
      console.error('Failed to export chart:', error);
    }
  };

  const handleExportSVG = () => {
    try {
      exportChartAsSVG(chartId, `${title.toLowerCase().replace(/\s+/g, '-')}-pie-chart`);
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
          <RechartsPieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: PieLabelRenderProps) => {
                const { name, percent } = props;
                const percentValue = typeof percent === 'number' ? percent * 100 : 0;
                return `${name}: ${percentValue.toFixed(0)}%`;
              }}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
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
          </RechartsPieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
});


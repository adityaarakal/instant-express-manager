import { memo } from 'react';
import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { ChartWrapper, CustomTooltip, formatCurrencyTooltip } from './ChartWrapper';

interface ScatterDataPoint {
  x: number;
  y: number;
  name?: string;
  [key: string]: string | number | undefined;
}

interface ScatterChartProps {
  data: ScatterDataPoint[];
  title: string;
  chartId: string;
  xAxisKey: string;
  yAxisKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showExport?: boolean;
  color?: string;
}

/**
 * Scatter Chart Component
 * Useful for showing relationships between two variables
 */
export const ScatterChart = memo(function ScatterChart({
  data,
  title,
  chartId,
  xAxisKey,
  yAxisKey,
  xAxisLabel,
  yAxisLabel,
  showExport = true,
  color = '#8884d8',
}: ScatterChartProps) {
  if (data.length === 0) {
    return (
      <ChartWrapper
        title={title}
        chartId={chartId}
        showExport={showExport}
        hasData={false}
        emptyMessage="No data available for scatter chart"
      >
        <></>
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper title={title} chartId={chartId} showExport={showExport} hasData={data.length > 0}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsScatterChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey={xAxisKey}
            name={xAxisLabel || xAxisKey}
            label={{ value: xAxisLabel || xAxisKey, position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            type="number"
            dataKey={yAxisKey}
            name={yAxisLabel || yAxisKey}
            label={{ value: yAxisLabel || yAxisKey, angle: -90, position: 'insideLeft' }}
          />
          <RechartsTooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={<CustomTooltip formatter={(value) => [formatCurrencyTooltip(value), '']} />}
          />
          <Scatter name="Data" dataKey={yAxisKey} fill={color}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={color} />
            ))}
          </Scatter>
          <Legend />
        </RechartsScatterChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
});


import { memo } from 'react';
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ChartWrapper, CustomTooltip, formatCurrencyTooltip } from './ChartWrapper';

interface RadarDataPoint {
  name: string;
  [key: string]: string | number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  title: string;
  chartId: string;
  radars: Array<{ dataKey: string; name: string; color: string }>;
  showExport?: boolean;
}

/**
 * Radar Chart Component
 * Useful for comparing multiple metrics across different categories
 */
export const RadarChart = memo(function RadarChart({
  data,
  title,
  chartId,
  radars,
  showExport = true,
}: RadarChartProps) {
  if (data.length === 0) {
    return (
      <ChartWrapper
        title={title}
        chartId={chartId}
        showExport={showExport}
        hasData={false}
        emptyMessage="No data available for radar chart"
      >
        <></>
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper title={title} chartId={chartId} showExport={showExport} hasData={data.length > 0}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis angle={90} domain={[0, 'auto']} />
          {radars.map((radar) => (
            <Radar
              key={radar.dataKey}
              name={radar.name}
              dataKey={radar.dataKey}
              stroke={radar.color}
              fill={radar.color}
              fillOpacity={0.6}
            />
          ))}
          <CustomTooltip formatter={(value) => [formatCurrencyTooltip(value), '']} />
          <Legend />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
});


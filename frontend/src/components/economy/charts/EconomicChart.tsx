"use client";

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid,
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { DataPoint } from "@/lib/economy/api/mockData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ChartType = "line" | "area" | "bar";

interface EconomicChartProps {
  title: string;
  description: string;
  data: DataPoint[];
  unit: string;
  type?: ChartType;
  color?: string;
  source?: string;
  isRealData?: boolean;
  dataFrequency?: string;
  lastPublished?: string | null;
}

export function EconomicChart({
  title,
  description,
  data,
  unit,
  type = "area",
  color = "#3b82f6",
  source,
  isRealData = false,
  dataFrequency,
  lastPublished,
}: EconomicChartProps) {

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-border p-3 rounded-lg shadow-lg backdrop-blur-sm text-sm">
          <p className="font-medium mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-semibold">{payload[0].value}{unit}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 10, left: -25, bottom: 0 },
    };
    switch (type) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} dy={10} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} tickFormatter={(v) => `${v}${unit}`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ r: 3, fill: color, strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} />
          </LineChart>
        );
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} dy={10} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} tickFormatter={(v) => `${v}${unit}`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case "area":
      default:
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id={`color-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} dy={10} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} tickFormatter={(v) => `${v}${unit}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fillOpacity={1} fill={`url(#color-${title.replace(/\s+/g, '')})`} />
          </AreaChart>
        );
    }
  };

  const latestValue = data[data.length - 1]?.value;
  const previousValue = data[data.length - 2]?.value;
  const change = latestValue && previousValue ? latestValue - previousValue : 0;
  const isPositive = change > 0;

  return (
    <Card className="h-full flex flex-col overflow-hidden bg-card/50 backdrop-blur-xl border-border/50">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold leading-tight">{title}</CardTitle>
            <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {source && (
                <span className="text-[10px] text-muted-foreground/70 font-medium">{source}</span>
              )}
              {dataFrequency && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
                  isRealData
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                }`}>
                  {isRealData ? '● ' : '~ '}{dataFrequency}
                </span>
              )}
            </div>
            {lastPublished && (
              <div className="text-[9px] text-muted-foreground/40 mt-0.5">
                Latest: {lastPublished}
              </div>
            )}
          </div>
          <div className="text-right shrink-0 ml-3">
            <div className="text-2xl font-bold">
              {latestValue?.toFixed(latestValue < 100 ? 1 : 0)}{unit}
            </div>
            <div className={`text-xs font-medium ${isPositive ? 'text-red-500' : 'text-emerald-500'}`}>
              {isPositive ? '+' : ''}{change.toFixed(2)}{unit}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 w-full pt-4" style={{ minHeight: 200 }}>
        <ResponsiveContainer width="100%" height={200} minHeight={200}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

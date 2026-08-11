"use client";

import ReactECharts from "echarts-for-react";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Activity, Server, Shield } from "lucide-react";
import { format, parseISO } from "date-fns";
import Link from "next/link";

export default function DashboardPage() {
  const { data: summary, isLoading, isError } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">SOC Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-zinc-900" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px] rounded-xl bg-zinc-900" />
          <Skeleton className="h-[400px] rounded-xl bg-zinc-900" />
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border border-red-900/50 bg-red-950/20 text-red-500">
        <AlertCircle className="mb-4 h-10 w-10" />
        <h2 className="text-lg font-semibold">Failed to load dashboard data</h2>
        <p className="text-sm">Please check your connection or backend API.</p>
      </div>
    );
  }

  const timelineOptions = {
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: summary.timeline.map((t) => format(parseISO(t.time), "HH:mm")),
      axisLabel: { color: "#a1a1aa" },
    },
    yAxis: { type: "value", axisLabel: { color: "#a1a1aa" }, splitLine: { lineStyle: { color: "#27272a" } } },
    series: [
      {
        data: summary.timeline.map((t) => t.count),
        type: "line",
        smooth: true,
        areaStyle: { opacity: 0.2 },
        itemStyle: { color: "#3b82f6" },
      },
    ],
  };

  const categoryOptions = {
    tooltip: { trigger: "item" },
    series: [
      {
        name: "Categories",
        type: "pie",
        radius: ["40%", "70%"],
        itemStyle: { borderRadius: 4, borderColor: "#09090b", borderWidth: 2 },
        label: { show: false },
        data: summary.categories.map((c) => ({ value: c.count, name: c.category })),
      },
    ],
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">SOC Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Events (24h)</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_events_24h.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Active Sources</CardTitle>
            <Server className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.sources.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Active Alerts</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              <Link href="/alerts" className="hover:underline">View Alerts</Link>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Live from Phase 9 Detection Engine</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Incidents</CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              <Link href="/incidents" className="hover:underline">View Incidents</Link>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Live from Phase 12 Correlation</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Event Volume</CardTitle>
            <CardDescription className="text-zinc-400">Ingested events over the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.timeline.length > 0 ? (
              <ReactECharts option={timelineOptions} style={{ height: "300px" }} theme="dark" opts={{ renderer: 'svg' }} />
            ) : (
              <div className="flex h-[300px] items-center justify-center text-zinc-500">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription className="text-zinc-400">Events by normalized category</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.categories.length > 0 ? (
              <ReactECharts option={categoryOptions} style={{ height: "300px" }} theme="dark" opts={{ renderer: 'svg' }} />
            ) : (
              <div className="flex h-[300px] items-center justify-center text-zinc-500">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 animate-fade-in">SOC Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-zinc-800/50 glass-card animate-pulse delay-100" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px] rounded-xl bg-zinc-800/50 glass-card animate-pulse delay-200" />
          <Skeleton className="h-[400px] rounded-xl bg-zinc-800/50 glass-card animate-pulse delay-300" />
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border border-red-900/50 bg-red-950/20 text-red-500 glass-card animate-fade-in">
        <AlertCircle className="mb-4 h-12 w-12 pulse-glow rounded-full" />
        <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">Failed to load dashboard data</h2>
        <p className="text-sm mt-2 opacity-80">Please check your connection or backend API.</p>
      </div>
    );
  }

  const timelineOptions = {
    tooltip: { trigger: "axis", backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', textStyle: { color: '#f8fafc' } },
    xAxis: {
      type: "category",
      data: summary.timeline.map((t) => format(parseISO(t.time), "HH:mm")),
      axisLabel: { color: "#94a3b8" },
      axisLine: { lineStyle: { color: "#334155" } }
    },
    yAxis: { type: "value", axisLabel: { color: "#94a3b8" }, splitLine: { lineStyle: { color: "rgba(255, 255, 255, 0.05)" } } },
    series: [
      {
        data: summary.timeline.map((t) => t.count),
        type: "line",
        smooth: 0.4,
        symbol: "none",
        lineStyle: { color: "#38bdf8", width: 3, shadowColor: "rgba(56, 189, 248, 0.5)", shadowBlur: 10 },
        areaStyle: { 
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(56, 189, 248, 0.3)' }, { offset: 1, color: 'rgba(56, 189, 248, 0)' }]
          }
        },
      },
    ],
  };

  const categoryOptions = {
    tooltip: { trigger: "item", backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', textStyle: { color: '#f8fafc' } },
    series: [
      {
        name: "Categories",
        type: "pie",
        radius: ["50%", "75%"],
        itemStyle: { borderRadius: 8, borderColor: "#020617", borderWidth: 4 },
        label: { show: false },
        data: summary.categories.map((c) => ({ value: c.count, name: c.category })),
        color: ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f87171']
      },
    ],
  };

  return (
    <div className="space-y-8 animate-fade-in p-2">
      <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">SOC Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="glass-card border-none animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Events (24h)</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_events_24h.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-none animate-slide-up delay-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Active Sources</CardTitle>
            <Server className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.sources.length}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none animate-slide-up delay-200">
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

        <Card className="glass-card border-none animate-slide-up delay-300">
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card border-none animate-slide-up delay-100">
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

        <Card className="glass-card border-none animate-slide-up delay-200">
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

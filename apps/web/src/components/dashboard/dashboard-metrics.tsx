import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Server, Shield } from "lucide-react";

interface DashboardMetricsProps {
  totalEvents24h: number;
  activeSources: number;
  telemetryCategories: number;
}

export function DashboardMetrics({
  totalEvents24h,
  activeSources,
  telemetryCategories,
}: DashboardMetricsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Total Events */}
      <Card className="bg-zinc-950 border-zinc-900 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-mono font-semibold tracking-wider text-zinc-500 uppercase">
            Total Events (24h)
          </CardTitle>
          <Activity className="h-4 w-4 text-zinc-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-mono tracking-tight text-zinc-100">
            {totalEvents24h.toLocaleString()}
          </div>
          <span className="text-[10px] text-zinc-600 font-mono mt-0.5 block">
            Ingested security log entries
          </span>
        </CardContent>
      </Card>

      {/* Active Sources */}
      <Card className="bg-zinc-950 border-zinc-900 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-mono font-semibold tracking-wider text-zinc-500 uppercase">
            Active Data Sources
          </CardTitle>
          <Server className="h-4 w-4 text-zinc-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-mono tracking-tight text-zinc-100">
            {activeSources}
          </div>
          <span className="text-[10px] text-zinc-600 font-mono mt-0.5 block">
            Active logs generators reporting in
          </span>
        </CardContent>
      </Card>

      {/* Telemetry Categories */}
      <Card className="bg-zinc-950 border-zinc-900 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-mono font-semibold tracking-wider text-zinc-500 uppercase">
            Telemetry Categories
          </CardTitle>
          <Shield className="h-4 w-4 text-zinc-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-mono tracking-tight text-zinc-100">
            {telemetryCategories}
          </div>
          <span className="text-[10px] text-zinc-600 font-mono mt-0.5 block">
            Different normalized message classes
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

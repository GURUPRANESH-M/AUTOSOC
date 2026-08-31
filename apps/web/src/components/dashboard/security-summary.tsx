import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Info } from "lucide-react";

interface SecuritySummaryProps {
  totalEvents24h: number;
  sourcesCount: number;
  categoriesCount: number;
}

export function SecuritySummary({
  totalEvents24h,
  sourcesCount,
  categoriesCount,
}: SecuritySummaryProps) {
  const hasEvents = totalEvents24h > 0;

  return (
    <Card className="bg-zinc-950 border-zinc-900 shadow-none">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-zinc-300 font-mono uppercase tracking-wider">
          Telemetry Activity Summary
        </CardTitle>
        <CardDescription className="text-xs text-zinc-500 font-mono">
          Factual diagnostic reporting of ingested telemetry
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasEvents ? (
          <div className="flex gap-4 items-start border border-zinc-900 bg-zinc-950 p-4 rounded-lg">
            <div className="rounded-lg bg-indigo-950/40 p-2 text-indigo-400 border border-indigo-900/50">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="font-mono text-xs font-semibold text-zinc-300">
                Active Telemetry Stream Ingestion
              </p>
              <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                The SOC monitoring system is actively ingesting events. A total of{" "}
                <span className="text-indigo-400 font-bold">{totalEvents24h.toLocaleString()}</span>{" "}
                log events have been normalized in the last 24 hours. These logs are originating from{" "}
                <span className="text-zinc-200 font-bold">{sourcesCount}</span> distinct source hosts
                and are classified across{" "}
                <span className="text-zinc-200 font-bold">{categoriesCount}</span> active security
                categories.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 items-start border border-zinc-900 bg-zinc-950 p-4 rounded-lg">
            <div className="rounded-lg bg-zinc-900 p-2 text-zinc-500 border border-zinc-800">
              <Info className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="font-mono text-xs font-semibold text-zinc-400">
                Telemetry Silence Detected
              </p>
              <p className="text-[11px] font-mono text-zinc-500 leading-relaxed">
                No security events were returned by the backend for the selected period. This indicates
                that either no telemetry generators (agents, syslog streams, flow collectors) are
                currently sending data, or the filters and pipeline are active but haven't encountered
                matching signature alerts. Verify connection status in the Data Sources panel.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import React from "react";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";
import { EventTimeline } from "@/components/dashboard/event-timeline";
import { EventCategories } from "@/components/dashboard/event-categories";
import { EventSources } from "@/components/dashboard/event-sources";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { purgeAllDatabaseRecords } from "@/lib/api/system";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const {
    data: summary,
    isLoading,
    isError,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useDashboardSummary();

  const [isPurgeModalOpen, setIsPurgeModalOpen] = React.useState(false);
  const [isPurging, setIsPurging] = React.useState(false);
  const [purgeStatus, setPurgeStatus] = React.useState("");
  const [purgeError, setPurgeError] = React.useState("");

  const handleRefresh = async () => {
    await refetch();
  };

  const handlePurgeDatabase = async () => {
    setIsPurging(true);
    setPurgeStatus("");
    setPurgeError("");
    try {
      const res = await purgeAllDatabaseRecords();
      setPurgeStatus(res.message || "Database successfully purged.");
      await queryClient.invalidateQueries();
      await refetch();
      setTimeout(() => {
        setIsPurgeModalOpen(false);
        setPurgeStatus("");
      }, 2000);
    } catch (err: any) {
      setPurgeError(err.message || "Failed to purge database records.");
    } finally {
      setIsPurging(false);
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 font-mono">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-zinc-900 pb-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-zinc-900" />
            <Skeleton className="h-4 w-96 bg-zinc-900" />
          </div>
          <Skeleton className="h-9 w-28 bg-zinc-900" />
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 bg-zinc-900 rounded-lg" />
          ))}
        </div>

        {/* Charts & Table Skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px] bg-zinc-900 rounded-lg" />
          <Skeleton className="h-[400px] bg-zinc-900 rounded-lg" />
        </div>
      </div>
    );
  }

  // 2. Error State
  if (isError || !summary) {
    return (
      <div className="flex h-[450px] flex-col items-center justify-center rounded-lg border border-red-900/40 bg-red-950/10 p-6 text-center font-mono">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500 animate-pulse" />
        <h3 className="text-lg font-bold text-red-400">Unable to load security telemetry</h3>
        <p className="text-xs text-zinc-500 max-w-sm mt-2 mb-6">
          The dashboard request failed. Please verify that the API backend is active and that your session is valid.
        </p>
        <Button
          onClick={handleRefresh}
          className="bg-red-950/40 border border-red-900/60 hover:bg-red-900/30 text-red-400 text-xs px-4"
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Retry Connection
        </Button>
      </div>
    );
  }

  // Derive counts
  const totalEvents = summary.total_events_24h || 0;
  const sourcesCount = summary.sources?.length || 0;
  const categoriesCount = summary.categories?.length || 0;

  return (
    <div className="space-y-6 font-mono relative">
      {/* Purge Database Confirmation Modal */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-red-900/60 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl font-mono">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2 bg-red-950/50 border border-red-900/60 rounded-full shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-400">Purge All Database Records?</h3>
                <p className="text-[11px] text-zinc-400">Irreversible System Reset</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              This action will permanently delete all <strong className="text-white">Incidents, Alerts, Predictions, and OpenSearch Log Events</strong> from PostgreSQL and OpenSearch.
            </p>

            {purgeStatus && (
              <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded text-emerald-400 text-xs">
                {purgeStatus}
              </div>
            )}

            {purgeError && (
              <div className="p-3 bg-red-950/20 border border-red-900/40 rounded text-red-400 text-xs">
                {purgeError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-900">
              <Button
                variant="outline"
                onClick={() => setIsPurgeModalOpen(false)}
                disabled={isPurging}
                className="h-8 border-zinc-800 bg-zinc-900 text-zinc-300 text-xs"
              >
                Cancel
              </Button>

              <Button
                onClick={handlePurgeDatabase}
                disabled={isPurging}
                className="h-8 bg-red-650 hover:bg-red-700 text-white text-xs font-bold px-4"
              >
                {isPurging ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Purging All Records...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Confirm Purge
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-900 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">
            Security Operations Center
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time security monitoring and threat visibility
          </p>
        </div>

        <div className="flex items-center gap-3">
          {dataUpdatedAt && (
            <div className="text-[10px] text-zinc-600 text-right mr-2">
              {isFetching ? (
                <span className="text-zinc-500 animate-pulse">Synchronizing stream...</span>
              ) : (
                <span>Last updated: {format(new Date(dataUpdatedAt), "HH:mm:ss")}</span>
              )}
            </div>
          )}

          <Button
            onClick={handleRefresh}
            disabled={isFetching}
            variant="outline"
            className="h-8 border-zinc-900 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs px-3"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin text-indigo-400" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={() => setIsPurgeModalOpen(true)}
            variant="outline"
            className="h-8 border-red-900/60 bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 text-xs px-3"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Purge Database
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <DashboardMetrics
        totalEvents24h={totalEvents}
        activeSources={sourcesCount}
        telemetryCategories={categoriesCount}
      />

      {/* Main Insights Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Event Timeline */}
        <div className="lg:col-span-2">
          <EventTimeline timeline={summary.timeline || []} />
        </div>

        {/* Categories Distribution */}
        <EventCategories categories={summary.categories || []} />

        {/* Event Sources */}
        <EventSources sources={summary.sources || []} />
      </div>
    </div>
  );
}

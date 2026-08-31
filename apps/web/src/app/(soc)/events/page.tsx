"use client";

import React, { useState } from "react";
import { useEvents } from "@/hooks/use-events";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { AlertCircle, RefreshCw, XCircle, ArrowRight, ShieldAlert, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sourceIpText, setSourceIpText] = useState<string>("");
  const [limitCount, setLimitCount] = useState<number>(50);

  const queryParams = {
    category: selectedCategory === "all" ? undefined : selectedCategory,
    source_ip: sourceIpText.trim() === "" ? undefined : sourceIpText.trim(),
    limit: limitCount,
  };

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useEvents(queryParams);

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setSourceIpText("");
    setLimitCount(50);
  };

  const handleSearchTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 font-mono">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-zinc-900 pb-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Log Explorer</h2>
            <p className="text-xs text-zinc-500">Search and investigate security telemetry</p>
          </div>
        </div>

        {/* Filters Skeletons */}
        <div className="flex flex-wrap gap-3 items-center">
          <Skeleton className="h-8 w-44 bg-zinc-900" />
          <Skeleton className="h-8 w-44 bg-zinc-900" />
          <Skeleton className="h-8 w-24 bg-zinc-900" />
        </div>

        {/* Table Skeletons */}
        <div className="border border-zinc-900 rounded-lg overflow-hidden bg-zinc-950/20">
          <div className="p-4 border-b border-zinc-900 flex gap-4">
            <Skeleton className="h-4 w-28 bg-zinc-900" />
            <Skeleton className="h-4 w-40 bg-zinc-900" />
            <Skeleton className="h-4 w-20 bg-zinc-900" />
            <Skeleton className="h-4 w-28 bg-zinc-900" />
            <Skeleton className="h-4 w-28 bg-zinc-900" />
            <Skeleton className="h-4 w-16 bg-zinc-900" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 border-b border-zinc-900 flex gap-4 items-center">
              <Skeleton className="h-5 w-28 bg-zinc-900" />
              <Skeleton className="h-5 w-40 bg-zinc-900" />
              <Skeleton className="h-5 w-20 bg-zinc-900" />
              <Skeleton className="h-5 w-28 bg-zinc-900" />
              <Skeleton className="h-5 w-28 bg-zinc-900" />
              <Skeleton className="h-5 w-16 bg-zinc-900" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Error State
  if (isError) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-red-900/40 bg-red-950/10 p-6 text-center font-mono">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500 animate-pulse" />
        <h3 className="text-lg font-bold text-red-400">Unable to load security events</h3>
        <p className="text-xs text-zinc-500 max-w-sm mt-2 mb-6">
          There was an error communicating with the OpenSearch upstream log cluster.
        </p>
        <Button
          onClick={() => refetch()}
          className="bg-red-950/40 border border-red-900/60 hover:bg-red-900/30 text-red-400 text-xs px-4"
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Retry Connection
        </Button>
      </div>
    );
  }

  const events = data?.events || [];

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-900 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Log Explorer</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Search and investigate security telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => refetch()}
            disabled={isFetching}
            variant="outline"
            className="h-8 border-zinc-900 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs px-3"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin text-indigo-400" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter controls row */}
      <form onSubmit={handleSearchTrigger} className="flex flex-wrap gap-4 items-end bg-zinc-950/40 p-4 border border-zinc-900 rounded-lg">
        {/* Category Filter */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold">Category:</span>
          <Select value={selectedCategory} onValueChange={(val) => val && setSelectedCategory(val)}>
            <SelectTrigger className="w-[180px] h-8 bg-zinc-950 border-zinc-900 text-xs capitalize">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-900 text-xs">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="authentication">Authentication</SelectItem>
              <SelectItem value="network">Network</SelectItem>
              <SelectItem value="process">Process</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Source IP Filter */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold">Source IP Address:</span>
          <Input
            placeholder="e.g. 192.168.1.1"
            value={sourceIpText}
            onChange={(e) => setSourceIpText(e.target.value)}
            className="w-[200px] h-8 bg-zinc-950 border-zinc-900 text-xs font-mono focus:border-zinc-800"
          />
        </div>

        {/* Limit Selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold">Limit Rows:</span>
          <Select value={limitCount.toString()} onValueChange={(val) => val && setLimitCount(parseInt(val))}>
            <SelectTrigger className="w-[120px] h-8 bg-zinc-950 border-zinc-900 text-xs">
              <SelectValue placeholder="Limit" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-900 text-xs">
              <SelectItem value="50">50 rows</SelectItem>
              <SelectItem value="100">100 rows</SelectItem>
              <SelectItem value="500">500 rows</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            className="h-8 bg-indigo-650 hover:bg-indigo-700 text-zinc-100 text-xs px-3 font-mono"
          >
            <Search className="h-3.5 w-3.5 mr-1.5" />
            Query
          </Button>

          {(selectedCategory !== "all" || sourceIpText !== "" || limitCount !== 50) && (
            <Button
              type="button"
              onClick={handleClearFilters}
              variant="ghost"
              className="h-8 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 text-xs px-2.5"
            >
              <XCircle className="h-3.5 w-3.5 mr-1.5 text-zinc-500" />
              Clear Filters
            </Button>
          )}
        </div>
      </form>

      {/* Events log queue table */}
      <div className="border border-zinc-900 rounded-lg overflow-hidden bg-zinc-950/20">
        <Table>
          <TableHeader className="bg-zinc-950/60 border-b border-zinc-900">
            <TableRow className="hover:bg-transparent border-zinc-900">
              <TableHead className="font-mono text-zinc-500 text-[10px] uppercase h-10 w-36">Time</TableHead>
              <TableHead className="font-mono text-zinc-500 text-[10px] uppercase h-10 w-36">Event ID</TableHead>
              <TableHead className="font-mono text-zinc-500 text-[10px] uppercase h-10 w-28">Category</TableHead>
              <TableHead className="font-mono text-zinc-500 text-[10px] uppercase h-10 w-28">Type</TableHead>
              <TableHead className="font-mono text-zinc-500 text-[10px] uppercase h-10 w-32">Source IP</TableHead>
              <TableHead className="font-mono text-zinc-500 text-[10px] uppercase h-10 w-32">Dest IP</TableHead>
              <TableHead className="font-mono text-zinc-500 text-[10px] uppercase h-10 w-24">Outcome</TableHead>
              <TableHead className="font-mono text-zinc-500 text-[10px] uppercase h-10 w-20 text-center">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {events.length === 0 ? (
              <TableRow className="hover:bg-transparent border-none">
                <TableCell colSpan={8} className="text-center h-48 py-8">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ShieldAlert className="h-8 w-8 text-zinc-700" />
                    <p className="text-xs font-semibold text-zinc-400">No security events found</p>
                    <p className="text-[11px] text-zinc-600 max-w-xs leading-relaxed mt-0.5">
                      Try adjusting the selected filters or category parameters.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.normalized_event_id} className="hover:bg-zinc-900/20 border-zinc-900">
                  <TableCell className="font-mono text-zinc-400 text-[11px] whitespace-nowrap py-3">
                    {event.event_time ? formatDistanceToNow(new Date(event.event_time), { addSuffix: true }) : "-"}
                  </TableCell>

                  <TableCell className="font-mono text-zinc-500 text-[11px] py-3 max-w-[120px] truncate">
                    {event.normalized_event_id}
                  </TableCell>

                  <TableCell className="py-3 font-medium text-zinc-200 text-[11px] capitalize">
                    {event.event_category}
                  </TableCell>

                  <TableCell className="font-mono text-zinc-400 text-[11px] py-3 capitalize">
                    {event.event_type}
                  </TableCell>

                  <TableCell className="font-mono text-zinc-400 text-[11px] py-3">
                    {event.source_ip || "-"}
                  </TableCell>

                  <TableCell className="font-mono text-zinc-400 text-[11px] py-3">
                    {event.destination_ip || "-"}
                  </TableCell>

                  <TableCell className="py-3">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold font-mono border uppercase ${
                        event.event_outcome === "success" || event.event_outcome === "allowed"
                          ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400"
                          : event.event_outcome === "failure" || event.event_outcome === "denied"
                          ? "bg-red-950/20 border-red-900/40 text-red-400"
                          : "bg-zinc-950 border-zinc-900 text-zinc-500"
                      }`}
                    >
                      {event.event_outcome}
                    </span>
                  </TableCell>

                  <TableCell className="py-3 text-center">
                    <Link
                      href={`/events/${event.normalized_event_id}`}
                      className="inline-flex h-6 w-6 items-center justify-center rounded border border-zinc-900 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

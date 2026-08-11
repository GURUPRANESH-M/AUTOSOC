"use client";

import { useState } from "react";
import { useEvents } from "@/hooks/use-events";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";

export default function EventsPage() {
  const router = useRouter();
  const [category, setCategory] = useState<string>("");
  const [sourceIp, setSourceIp] = useState<string>("");
  const [limit, setLimit] = useState<number>(50);

  const { data, isLoading, isError, refetch } = useEvents({
    category: category || undefined,
    source_ip: sourceIp || undefined,
    limit,
  });

  const handleSearch = () => {
    refetch();
  };

  const clearFilters = () => {
    setCategory("");
    setSourceIp("");
    setLimit(50);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Log Explorer</h1>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 p-4">
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Category</label>
            <Select value={category} onValueChange={(val) => setCategory(val || "")}>
              <SelectTrigger className="bg-zinc-950 border-zinc-800">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="none">All Categories</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="process">Process</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Source IP</label>
            <Input
              placeholder="e.g. 192.168.1.1"
              value={sourceIp}
              onChange={(e) => setSourceIp(e.target.value)}
              className="bg-zinc-950 border-zinc-800"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Limit</label>
            <Select value={limit.toString()} onValueChange={(val) => setLimit(parseInt(val || "50"))}>
              <SelectTrigger className="bg-zinc-950 border-zinc-800">
                <SelectValue placeholder="Limit" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="50">50 rows</SelectItem>
                <SelectItem value="100">100 rows</SelectItem>
                <SelectItem value="500">500 rows</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={handleSearch} className="w-full">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
            <Button onClick={clearFilters} variant="outline" className="border-zinc-800 bg-zinc-950">
              Clear
            </Button>
          </div>
        </div>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader className="bg-zinc-950">
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source IP</TableHead>
                <TableHead>Dest IP</TableHead>
                <TableHead>Outcome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-500" />
                  </TableCell>
                </TableRow>
              )}
              {isError && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-red-500">
                    Failed to load events.
                  </TableCell>
                </TableRow>
              )}
              {data && data.events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                    No events found.
                  </TableCell>
                </TableRow>
              )}
              {data &&
                data.events.map((event) => (
                  <TableRow
                    key={event.normalized_event_id}
                    className="border-zinc-800 cursor-pointer hover:bg-zinc-800/50"
                    onClick={() => router.push(`/events/${event.normalized_event_id}`)}
                  >
                    <TableCell className="font-mono text-xs">
                      {format(parseISO(event.event_time), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell>{event.event_category}</TableCell>
                    <TableCell>{event.event_type}</TableCell>
                    <TableCell className="font-mono text-xs">{event.source_ip || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{event.destination_ip || "-"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          event.event_outcome === "success"
                            ? "bg-green-950 text-green-400"
                            : event.event_outcome === "failure"
                            ? "bg-red-950 text-red-400"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {event.event_outcome}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

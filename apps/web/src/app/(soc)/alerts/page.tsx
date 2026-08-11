"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface AlertResponse {
  id: string;
  title: string;
  severity: string;
  status: string;
  rule_id: string;
  created_at: string;
}

export default function AlertsPage() {
  const { data: alerts, isLoading, error } = useQuery<AlertResponse[]>({
    queryKey: ["alerts"],
    queryFn: () => fetchApi("/alerts?limit=100"),
    refetchInterval: 10000,
  });

  if (isLoading) return <div className="p-8">Loading alerts...</div>;
  if (error) return <div className="p-8 text-destructive">Error loading alerts</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Alerts</h2>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!alerts || alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  No active alerts found.
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      alert.severity === "critical" ? "destructive" :
                      alert.severity === "high" ? "destructive" :
                      alert.severity === "medium" ? "default" : "secondary"
                    }>
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/alerts/${alert.id}`} className="font-medium hover:underline text-primary">
                      {alert.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {alert.status === "new" && <AlertCircle className="h-4 w-4 text-red-500" />}
                      {alert.status === "investigating" && <Clock className="h-4 w-4 text-yellow-500" />}
                      {(alert.status === "resolved" || alert.status === "false_positive") && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      <span className="capitalize">{alert.status.replace("_", " ")}</span>
                    </div>
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

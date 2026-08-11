"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParams } from "next/navigation";

// Define Alert interface to replace any
interface Indicator {
  type: string;
  value: string;
}
interface AlertData {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  rule_id?: string;
  created_at: string;
  indicators_json?: Indicator[];
}

export default function AlertDetailPage() {
  const { alertId } = useParams() as { alertId: string };
  const queryClient = useQueryClient();

  const { data: alert, isLoading } = useQuery<AlertData>({
    queryKey: ["alerts", alertId],
    queryFn: () => fetchApi(`/alerts/${alertId}`),
  });

  const mutation = useMutation({
    mutationFn: (newStatus: string) => fetchApi(`/alerts/${alertId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!alert) return <div className="p-8">Alert not found.</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{alert.title}</h2>
          <p className="text-muted-foreground mt-2">{alert.id}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select 
            value={alert.status} 
            onValueChange={(val) => mutation.mutate(val as string)}
            disabled={mutation.isPending}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="false_positive">False Positive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold uppercase">{alert.severity}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{alert.status.replace("_", " ")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rule ID</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm break-all font-mono">{alert.rule_id || "N/A"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{new Date(alert.created_at).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Why this triggered</CardTitle>
            <CardDescription>Human-readable deterministic rule explanation</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{alert.description}</p>
            
            <h4 className="mt-6 mb-2 font-semibold">Entities</h4>
            {alert.indicators_json && Array.isArray(alert.indicators_json) ? (
              <div className="flex gap-2 flex-wrap">
                {alert.indicators_json.map((ind: Indicator, i: number) => (
                  <Badge key={i} variant="outline" className="text-sm py-1">
                    <span className="text-muted-foreground mr-1">{ind.type}:</span> {ind.value}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No distinct entities extracted.</p>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Candidate MITRE context</CardTitle>
            <CardDescription className="text-yellow-600 dark:text-yellow-500 font-semibold">
              Candidate ATT&CK context — final mapping occurs later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The detection rule suggests the following tactics or techniques may be involved:
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge>T1110</Badge>
              <Badge variant="secondary">Credential Access</Badge>
            </div>
            
            <h4 className="mt-6 mb-2 font-semibold">Investigation guidance</h4>
            <p className="text-sm text-muted-foreground border-l-4 border-primary pl-4 py-1">
              Verify if the user was targeted, check source IP reputation, and investigate subsequent successful logins.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

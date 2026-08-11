"use client";

import { useEvent } from "@/hooks/use-events";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, AlertTriangle, ShieldCheck } from "lucide-react";
import { format, parseISO } from "date-fns";

function CopyButton({ value }: { value: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 text-zinc-500 hover:text-zinc-100"
      onClick={() => navigator.clipboard.writeText(value)}
      title="Copy to clipboard"
    >
      <Copy className="h-3 w-3" />
    </Button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3 border-b border-zinc-800">
        <CardTitle className="text-base text-zinc-300">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-2 text-sm">{children}</CardContent>
    </Card>
  );
}

function Field({ label, value, copyable = false, mono = false }: { label: string; value: unknown; copyable?: boolean; mono?: boolean }) {
  if (value === undefined || value === null || value === "") return null;
  const displayValue = String(value);

  // Auto-redaction safeguard for frontend if backend missed it
  if (label.toLowerCase().includes("password") || label.toLowerCase().includes("secret") || label.toLowerCase().includes("token")) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center py-1">
        <span className="w-48 text-zinc-500 font-medium">{label}</span>
        <span className="text-red-500 italic font-mono">[REDACTED]</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-1 group">
      <span className="w-48 text-zinc-500 font-medium shrink-0">{label}</span>
      <span className={`text-zinc-300 break-all ${mono ? "font-mono text-xs" : ""}`}>
        {displayValue}
      </span>
      {copyable && <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"><CopyButton value={displayValue} /></div>}
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const { data: event, isLoading, isError } = useEvent(eventId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full bg-zinc-900" />
          <Skeleton className="h-8 w-64 bg-zinc-900" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[300px] rounded-xl bg-zinc-900" />
          <Skeleton className="h-[300px] rounded-xl bg-zinc-900" />
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border border-red-900/50 bg-red-950/20 text-red-500">
        <h2 className="text-lg font-semibold">Event Not Found</h2>
        <p className="text-sm">The event you are looking for does not exist or you do not have permission to view it.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/events")} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Event Detail</h1>
        <span className="font-mono text-sm text-zinc-500">{event.normalized_event_id}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Overview">
          <Field label="Timestamp" value={format(parseISO(event.event_time), "yyyy-MM-dd HH:mm:ss.SSS")} mono />
          <Field label="Category" value={event.event_category} />
          <Field label="Type" value={event.event_type} />
          <Field label="Action" value={event.event_action} />
          <Field label="Outcome" value={event.event_outcome} />
          <Field label="Source Name" value={event.source_name} />
          <Field label="Source Type" value={event.source_type} />
        </Section>

        <Section title="Network">
          <Field label="Source IP" value={event.source_ip} copyable mono />
          <Field label="Source Port" value={event.source_port} mono />
          <Field label="Destination IP" value={event.destination_ip} copyable mono />
          <Field label="Destination Port" value={event.destination_port} mono />
          <Field label="Protocol" value={event.network_protocol} />
          <Field label="Direction" value={event.network_direction} />
          <Field label="Bytes Transferred" value={event.network_bytes} />
          <Field label="Packets" value={event.network_packets} />
        </Section>
        
        <Section title="Identity">
          <Field label="Username" value={event.user_name} copyable />
          <Field label="User ID" value={event.user_id} copyable mono />
          <Field label="Domain" value={event.user_domain} />
          <Field label="Privilege Context" value={event.user_privilege} />
        </Section>

        <Section title="Host">
          <Field label="Hostname" value={event.host_name} copyable />
          <Field label="Host ID" value={event.host_id} copyable mono />
          <Field label="OS" value={event.host_os} />
          <Field label="MAC Address" value={event.host_mac} mono />
        </Section>

        <Section title="Process & File">
          <Field label="Process Name" value={event.process_name} copyable />
          <Field label="PID" value={event.process_id} mono />
          <Field label="Command Line" value={event.process_command_line} copyable mono />
          <Field label="Parent Process" value={event.process_parent_name} />
          <Field label="File Name" value={event.file_name} />
          <Field label="File Path" value={event.file_path} copyable mono />
          <Field label="File Hash" value={event.file_hash} copyable mono />
        </Section>

        <Section title="Enrichment">
          <div className="mb-4 flex items-center gap-2 rounded-md bg-blue-950/50 p-2 text-xs text-blue-400 border border-blue-900/50">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <p>Context only — not a threat determination</p>
          </div>
          <Field label="Asset Context" value={event.enrichment?.asset?.category} />
          <Field label="Asset Environment" value={event.enrichment?.asset?.environment} />
          <Field label="Geo Country" value={event.enrichment?.geo?.country} />
          <Field label="Geo City" value={event.enrichment?.geo?.city} />
          <Field label="Reputation Score" value={event.enrichment?.reputation?.score} />
          <Field label="Reputation Tags" value={event.enrichment?.reputation?.tags?.join(", ")} />
          {event.enrichment?.mitre?.candidate_tactics && (
             <Field label="MITRE Tactics" value={event.enrichment.mitre.candidate_tactics.join(", ")} />
          )}
        </Section>

        <Section title="Provenance">
          <Field label="Normalization ID" value={event.normalized_event_id} copyable mono />
          <Field label="Ingestion ID" value={event.ingestion_id} copyable mono />
          <Field label="Trace ID" value={event.trace_id} copyable mono />
          <Field label="Parser" value={event.parser_name} />
          <Field label="Schema Version" value={event.schema_version} />
          
          {event.normalization_warnings && event.normalization_warnings.length > 0 && (
             <div className="mt-4 rounded-md bg-yellow-950/30 p-3 border border-yellow-900/50">
               <div className="flex items-center gap-2 text-yellow-500 mb-2">
                 <AlertTriangle className="h-4 w-4" />
                 <span className="text-sm font-semibold">Normalization Warnings</span>
               </div>
               <ul className="list-disc pl-5 text-xs text-yellow-400/80 space-y-1">
                 {event.normalization_warnings.map((w: string, i: number) => (
                   <li key={i}>{w}</li>
                 ))}
               </ul>
             </div>
          )}
        </Section>
      </div>
    </div>
  );
}

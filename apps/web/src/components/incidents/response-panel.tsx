"use client";

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldAlert, Info, Lock } from "lucide-react";

interface ResponsePanelProps {
  incidentId: string;
}

export function ResponsePanel({ incidentId }: ResponsePanelProps) {
  return (
    <div className="space-y-6 font-mono">
      <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
        <div>
          <h3 className="text-lg font-medium text-zinc-100">Response Actions & Containment</h3>
          <p className="text-xs text-zinc-500 mt-1">Manage approvals and execute containment playbooks securely.</p>
        </div>
      </div>

      <Alert className="bg-zinc-950 border-zinc-900 text-zinc-400">
        <ShieldAlert className="h-4 w-4 text-zinc-500" />
        <AlertTitle className="text-zinc-300 font-bold uppercase tracking-wider text-xs">
          Containment Actions Offline
        </AlertTitle>
        <AlertDescription className="text-[11px] leading-relaxed mt-1 text-zinc-500">
          The response control subsystem is currently disabled on the backend API router. Real-time blocking, containment, and playbooks execution features are disabled in this environment.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-zinc-950/20 border-zinc-900 shadow-none">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-zinc-650" />
              Containment Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-zinc-600 font-mono leading-relaxed">
            Automatic active response controls (such as host isolation, IP blocking, or service restriction) require deployment of the responses gateway.
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/20 border-zinc-900 shadow-none">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-zinc-650" />
              Audit Log Context
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-zinc-600 font-mono leading-relaxed">
            Incident note summaries and workflow changes are persistently logged to audit trails. Active actions require high privilege role elevation authorization.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

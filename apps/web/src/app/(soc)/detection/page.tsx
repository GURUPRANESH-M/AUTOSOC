"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function DetectionPlaceholderPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Detection Engine</h2>
          <p className="text-sm text-zinc-400">
            Real-time rule evaluations, analytics, and signature matching
          </p>
        </div>
      </div>

      <Card className="bg-zinc-900/40 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-950/50 p-2 border border-emerald-900/50 text-emerald-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-zinc-100">Detection Engine Status</CardTitle>
              <CardDescription className="text-zinc-500">
                Evaluation status of dynamic sigma rules and event queries.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-400">
          <p>
            The detection engine evaluates incoming normalized events against active rules and pushes corresponding alert findings to correlation buffers.
          </p>
          <div className="border border-dashed border-zinc-800 rounded-lg p-8 text-center text-zinc-500">
            For rule definitions and enablement toggles, refer to the Rules tab.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

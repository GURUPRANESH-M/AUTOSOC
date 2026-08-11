"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { useSession } from "next-auth/react";
import { Copy } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(3).max(50),
  source_type: z.enum(["synthetic", "http_json", "syslog", "windows_event", "network_flow", "kubernetes_audit", "aws_cloudtrail"]),
  environment: z.string().min(2).max(20),
});

export function DataSourceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { environment: "development", source_type: "synthetic" },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) =>
      fetchApi<{ api_key?: string }>("/data-sources", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.accessToken}` },
        body: JSON.stringify(values),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["data-sources"] });
      if (data.api_key) {
        setApiKey(data.api_key);
      } else {
        onOpenChange(false);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) setApiKey(null);
      onOpenChange(val);
    }}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{apiKey ? "API Key Generated" : "Add Data Source"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {apiKey
              ? "Please copy this API Key immediately. You will not be able to see it again."
              : "Register a new event source for ingestion."}
          </DialogDescription>
        </DialogHeader>

        {apiKey ? (
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 rounded-md bg-zinc-950 border border-zinc-800 p-3">
              <code className="flex-1 text-sm text-green-400 font-mono break-all">{apiKey}</code>
              <Button size="icon" variant="ghost" onClick={() => navigator.clipboard.writeText(apiKey)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Source Name</Label>
              <Input id="name" {...register("name")} className="bg-zinc-950 border-zinc-800" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="source_type">Source Type</Label>
              <Select onValueChange={(val) => setValue("source_type", val as "synthetic" | "http_json" | "syslog" | "windows_event" | "network_flow" | "kubernetes_audit" | "aws_cloudtrail")} defaultValue="synthetic">
                <SelectTrigger className="bg-zinc-950 border-zinc-800">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="synthetic">Synthetic</SelectItem>
                  <SelectItem value="http_json">HTTP JSON</SelectItem>
                  <SelectItem value="syslog">Syslog</SelectItem>
                  <SelectItem value="windows_event">Windows Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Input id="environment" {...register("environment")} className="bg-zinc-950 border-zinc-800" />
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create Data Source"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

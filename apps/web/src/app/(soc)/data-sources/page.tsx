"use client";

import { useDataSources, DataSource } from "@/hooks/use-data-sources";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Plus, Database, AlertCircle, CheckCircle2 } from "lucide-react";
import { DataSourceDialog } from "@/components/soc/data-source-dialog";
import { useState } from "react";

export default function DataSourcesPage() {
  const { data, isLoading, isError } = useDataSources();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Data Sources</h1>
        
        <PermissionGuard allowedRoles={["admin", "system:admin"]} requireSuperuser>
          <Button onClick={() => setIsDialogOpen(true)} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Source
          </Button>
        </PermissionGuard>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader className="bg-zinc-950">
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24">
                    <Skeleton className="h-6 w-full bg-zinc-800" />
                  </TableCell>
                </TableRow>
              )}
              {isError && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-red-500">
                    Failed to load data sources.
                  </TableCell>
                </TableRow>
              )}
              {data && data.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-zinc-500 flex flex-col items-center justify-center">
                    <Database className="h-8 w-8 text-zinc-600 mb-2" />
                    No data sources found.
                  </TableCell>
                </TableRow>
              )}
              {data &&
                data.items.map((source: DataSource) => (
                  <TableRow key={source.id} className="border-zinc-800">
                    <TableCell className="font-medium text-zinc-200">{source.name}</TableCell>
                    <TableCell>{source.source_type}</TableCell>
                    <TableCell className="uppercase text-xs">{source.ingestion_method}</TableCell>
                    <TableCell>{source.environment}</TableCell>
                    <TableCell>
                      {source.status === "healthy" ? (
                        <div className="flex items-center text-green-500">
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Healthy
                        </div>
                      ) : source.status === "degraded" ? (
                        <div className="flex items-center text-yellow-500">
                          <AlertCircle className="mr-2 h-4 w-4" /> Degraded
                        </div>
                      ) : (
                        <div className="flex items-center text-red-500">
                          <AlertCircle className="mr-2 h-4 w-4" /> Failing
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <PermissionGuard allowedRoles={["admin", "system:admin"]} requireSuperuser>
                        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                          Edit
                        </Button>
                      </PermissionGuard>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <PermissionGuard allowedRoles={["admin", "system:admin"]} requireSuperuser>
        <DataSourceDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      </PermissionGuard>
    </div>
  );
}

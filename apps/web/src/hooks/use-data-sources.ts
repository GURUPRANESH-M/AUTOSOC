import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { useSession } from "next-auth/react";

export interface DataSource {
  id: string;
  name: string;
  source_type: string;
  is_enabled: boolean;
  status: string;
  environment: string;
  ingestion_method: string;
  created_at: string;
  updated_at: string;
}

export function useDataSources() {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: ["data-sources"],
    queryFn: () =>
      fetchApi<{ items: DataSource[]; total: number }>("/data-sources", {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      }),
    enabled: status === "authenticated" && !!session?.accessToken,
  });
}

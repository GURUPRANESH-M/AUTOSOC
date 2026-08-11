import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { useSession } from "next-auth/react";

export interface LogExplorerParams {
  category?: string;
  source_ip?: string;
  limit?: number;
}

export function useEvents(params: LogExplorerParams) {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: ["events", params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params.category) searchParams.append("category", params.category);
      if (params.source_ip) searchParams.append("source_ip", params.source_ip);
      if (params.limit) searchParams.append("limit", params.limit.toString());

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return fetchApi<{ total: number; events: any[] }>(`/events?${searchParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });
    },
    enabled: status === "authenticated" && !!session?.accessToken,
  });
}

export function useEvent(eventId: string) {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: ["events", eventId],
    queryFn: () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetchApi<any>(`/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      }),
    enabled: status === "authenticated" && !!session?.accessToken && !!eventId,
  });
}

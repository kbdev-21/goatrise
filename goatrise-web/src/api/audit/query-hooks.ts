import { queryOptions } from "@tanstack/react-query";
import { findAuditLogs, type FindAuditLogsParams } from "@/api/audit/api";

export const auditLogKeys = {
  all: ["audit-logs"] as const,
  list: (params?: FindAuditLogsParams) => [...auditLogKeys.all, "list", params] as const,
};

// queryOptions: reuse cho cả loader (queryClient.ensureQueryData) lẫn component (useQuery)
export const auditLogsQueryOptions = (params?: FindAuditLogsParams) =>
  queryOptions({
    queryKey: auditLogKeys.list(params),
    queryFn: () => findAuditLogs(params),
  });

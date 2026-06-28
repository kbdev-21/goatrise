import { useQuery } from "@tanstack/react-query";
import { findAuditLogs, type FindAuditLogsParams } from "@/api/audit/api.ts";

export const auditLogKeys = {
  all: ["audit-logs"] as const,
  list: (params?: FindAuditLogsParams) => [...auditLogKeys.all, "list", params] as const,
};

export function useAuditLogs(params?: FindAuditLogsParams) {
  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: () => findAuditLogs(params),
  });
}

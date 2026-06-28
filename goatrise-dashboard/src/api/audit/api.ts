import axiosInstance from "@/api/axios-instance.ts";

export async function findAuditLogs(params?: FindAuditLogsParams): Promise<AuditLog[]> {
  const res = await axiosInstance.get<AuditLog[]>("/api/audit-logs", { params });
  return res.data;
}

// Mirror backend: module/audit/schema/audit-logs.schema.ts (createdAt serialized as ISO string)
export type AuditLog = {
  id: string;
  actorId: string | null;
  code: string;
  referenceType: string | null;
  referenceId: string | null;
  metadata: unknown;
  createdAt: string;
};

export type FindAuditLogsParams = {
  search?: string;
  offset?: number;
  limit?: number;
};

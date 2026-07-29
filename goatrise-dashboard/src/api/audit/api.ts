import axiosInstance from "@/api/axios-instance.ts";

export async function findAuditLogs(params?: FindAuditLogsParams): Promise<AuditLog[]> {
  const res = await axiosInstance.get<AuditLog[]>("/api/audit-logs", { params });
  return res.data;
}

// Base: cột gốc của audit-log (mirror AuditLogBase backend)
export type AuditLogBase = {
  id: string;
  actorId: string | null;
  code: string;
  referenceType: string | null;
  referenceId: string | null;
  metadata: unknown;
  createdAt: string;
};

export type AuditLog = AuditLogBase;

export type FindAuditLogsParams = {
  search?: string;
  offset?: number;
  limit?: number;
};

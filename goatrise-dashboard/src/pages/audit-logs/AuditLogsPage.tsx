import { useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import { useAuditLogs } from "@/api/audit/query-hooks.ts";
import type { AuditLog } from "@/api/audit/api.ts";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";

const PAGE_SIZE = 20;

export default function AuditLogsPage() {
  // ----- query states (mirror backend /api/audit-logs filters) -----
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // chỉ search khi nhấn Enter, không gọi request mỗi lần gõ
  function commitSearch() {
    setSearch(searchInput.trim());
    setOffset(0);
  }

  const params = useMemo(
    () => ({
      search: search || undefined,
      offset,
      limit: PAGE_SIZE,
    }),
    [search, offset],
  );

  const auditLogsQuery = useAuditLogs(params);

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const hasPrevious = offset > 0;
  const hasNext = (auditLogsQuery.data?.length ?? 0) === PAGE_SIZE;

  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      <h1 className="text-2xl font-medium">Audit Logs</h1>

      {/* ----- filters ----- */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Input
            placeholder="Search actor, code or reference..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitSearch();
            }}
            className="bg-card pr-9"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={commitSearch}
            aria-label="Search"
            className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
          >
            <Search className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* ----- table ----- */}
      {auditLogsQuery.isLoading ? (
        <div className="bg-card flex items-center justify-center rounded-md border p-6">
          <Spinner className="text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Actor ID</TableHead>
                <TableHead>Reference ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogsQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-destructive text-center">
                    Failed to load audit logs.
                  </TableCell>
                </TableRow>
              ) : !auditLogsQuery.data || auditLogsQuery.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              ) : (
                auditLogsQuery.data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.code}</TableCell>
                    <TableCell>{log.actorId ?? "—"}</TableCell>
                    <TableCell>
                      {log.referenceType || log.referenceId
                        ? `${log.referenceType ?? "—"} · ${log.referenceId ?? "—"}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {new Date(log.createdAt).toLocaleString("en-GB")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="View details"
                          title="View details"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ----- pagination ----- */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">
          Page {page}
          {auditLogsQuery.isFetching ? " · updating..." : ""}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrevious || auditLogsQuery.isFetching}
            onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext || auditLogsQuery.isFetching}
            onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      </div>

      <AuditLogDetailDialog
        log={selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="col-span-2 text-sm break-all">{value}</span>
    </div>
  );
}

function AuditLogDetailDialog({
  log,
  onOpenChange,
}: {
  log: AuditLog | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!log} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Audit Log Detail</DialogTitle>
        </DialogHeader>
        {log && (
          <div className="divide-border min-w-0 divide-y flex flex-col gap-2">
            <DetailRow label="ID" value={log.id} />
            <DetailRow label="Code" value={log.code} />
            <DetailRow label="Actor ID" value={log.actorId ?? "—"} />
            <DetailRow
              label="Reference Type"
              value={log.referenceType ?? "—"}
            />
            <DetailRow label="Reference ID" value={log.referenceId ?? "—"} />
            <DetailRow
              label="Date"
              value={new Date(log.createdAt).toLocaleString("en-GB")}
            />
            <div className="py-1.5">
              <span className="text-muted-foreground text-sm">Metadata</span>
              <pre className="bg-muted text-foreground mt-1.5 max-h-64 overflow-y-auto rounded-md p-3 font-mono text-xs break-all whitespace-pre-wrap">
                {log.metadata == null
                  ? "—"
                  : JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

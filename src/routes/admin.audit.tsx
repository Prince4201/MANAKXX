import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/manakx/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Audit Logs — MANAKX" }] }),
  component: AdminAudit,
});

function AdminAudit() {
  // Mock audit logs for the prototype
  const auditLogs = [
    { id: "LOG-001", user: "Admin User", role: "Admin", action: "UPDATE_AI_WEIGHTS", entity: "System", details: "Changed 'Category match' weight to 10", date: new Date().toISOString() },
    { id: "LOG-002", user: "Procurement Officer", role: "Government Procurement Officer", action: "CREATE_PROCUREMENT", entity: "Analysis (TND-2026-904)", details: "Created new procurement analysis", date: new Date(Date.now() - 86400000).toISOString() },
    { id: "LOG-003", user: "Technical SME", role: "Technical Reviewer", action: "REVIEW_DECISION", entity: "Review (REV-093)", details: "Approved IS 15410:2003", date: new Date(Date.now() - 172800000).toISOString() },
    { id: "LOG-004", user: "Vendor Rep", role: "Vendor/Supplier", action: "START_ASSESSMENT", entity: "Assessment (TND-2026-904)", details: "Started self-assessment", date: new Date(Date.now() - 259200000).toISOString() },
  ];

  return (
    <AppShell title="System Audit Logs" description="View system-wide user actions and events." crumbs={[{ label: "Admin", path: "/admin" }, { label: "Audit Logs" }]}>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs text-muted-foreground">{new Date(log.date).toLocaleString()}</TableCell>
                <TableCell className="font-medium">{log.user}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{log.role}</TableCell>
                <TableCell>
                  <span className="inline-flex rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                    {log.action}
                  </span>
                </TableCell>
                <TableCell className="text-sm font-medium">{log.entity}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{log.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
}

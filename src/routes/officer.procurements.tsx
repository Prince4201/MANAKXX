import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderOpen, PlusCircle } from "lucide-react";
import { AppShell } from "@/components/manakx/AppShell";
import { StatusBadge } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/lib/manakx/store";

export const Route = createFileRoute("/officer/procurements")({
  head: () => ({ meta: [{ title: "My Procurements — MANAKX" }] }),
  component: OfficerProcurements,
});

function OfficerProcurements() {
  const { analyses, user } = useStore();
  
  // For the demo, filter to the officer's procurements (or just show all if demoing)
  // In a real app, RLS handles this. Here we'll show all so the demo is full of data.
  const procurements = analyses;

  return (
    <AppShell
      title="My Procurements"
      description="Manage and track your active and past procurement analyses."
      crumbs={[{ label: "Procurements" }]}
      actions={
        <Button asChild>
          <Link to="/analysis/new">
            <PlusCircle className="mr-2 h-4 w-4" /> New Procurement
          </Link>
        </Button>
      }
    >
      {procurements.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
              <FolderOpen className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No procurements yet</h3>
            <p className="mb-6 text-sm text-muted-foreground max-w-md">
              Start by creating a new procurement analysis. Upload your technical specification to get AI-recommended standards.
            </p>
            <Button asChild>
              <Link to="/analysis/new">Create New Procurement</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Procurement ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity (Est)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requirements</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {procurements.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs font-medium">{a.id}</TableCell>
                  <TableCell className="max-w-[200px] truncate font-medium" title={a.tenderTitle}>{a.tenderTitle}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.category}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">—</TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                  <TableCell className="text-sm">{a.requirements.length}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                      <Link to="/analysis/$id" params={{ id: a.id }}>
                        {a.status === "Draft" ? "Continue" : "Open"}
                      </Link>
                    </Button>
                    {(a.status === "Completed" || a.status === "Approved") && (
                      <Button asChild variant="outline" size="sm" className="ml-2 h-8 text-xs">
                        <Link to="/analysis/$id/report" params={{ id: a.id }}>Report</Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </AppShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/manakx/AppShell";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVendorAssessments } from "@/lib/manakx/use-assessments";
import { useSupabaseQuery } from "@/lib/manakx/use-realtime";
import type { Product } from "@/lib/manakx/types";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

type ProcurementSummary = {
  id: string;
  tender_title: string;
};

export const Route = createFileRoute("/vendor/assessments/")({
  head: () => ({ meta: [{ title: "Self-Assessments — MANAKX" }] }),
  component: VendorAssessmentsHistory,
});

function VendorAssessmentsHistory() {
  const { assessments, loading } = useVendorAssessments();
  const { data: procurements } = useSupabaseQuery<ProcurementSummary>("analyses", { select: "id, tender_title" });
  const { data: products } = useSupabaseQuery<Product>("products", { select: "id, name" });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 className="mr-1 h-3 w-3" /> Completed</Badge>;
      case "PROCESSING":
        return <Badge variant="secondary" className="text-blue-600"><Clock className="mr-1 h-3 w-3" /> Processing</Badge>;
      case "FAILED":
        return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" /> Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProcurementName = (id: string) => {
    const p = procurements.find(p => p.id === id);
    return p ? p.tender_title : id;
  };

  const getProductName = (id: string) => {
    const p = products.find(p => p.id === id);
    return p ? p.name : id;
  };

  return (
    <AppShell
      title="Self-Assessments"
      description="View history of your product assessments against government procurements."
      crumbs={[{ label: "Vendor", path: "/vendor" }, { label: "Assessments" }]}
    >
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Procurement</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Loading assessments...
                </TableCell>
              </TableRow>
            ) : assessments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  You have not run any self-assessments yet.
                </TableCell>
              </TableRow>
            ) : (
              assessments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(a.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate" title={getProcurementName(a.procurement_id)}>
                    {getProcurementName(a.procurement_id)}
                  </TableCell>
                  <TableCell className="truncate" title={getProductName(a.product_id)}>
                    {getProductName(a.product_id)}
                  </TableCell>
                  <TableCell>{getStatusBadge(a.status)}</TableCell>
                  <TableCell>
                    {a.overall_score !== undefined ? (
                      <span className="font-semibold">{a.overall_score}%</span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/vendor/assessments/new`} search={{ procurement: a.procurement_id }}>
                        {a.status === "COMPLETED" ? "View Report" : "Resume"}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
}

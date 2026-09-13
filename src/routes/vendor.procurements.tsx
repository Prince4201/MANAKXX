import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/manakx/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/manakx/store";
import { Button } from "@/components/ui/button";
import { ClipboardCheck } from "lucide-react";

export const Route = createFileRoute("/vendor/procurements")({
  head: () => ({ meta: [{ title: "Available Procurements — MANAKX" }] }),
  component: VendorProcurements,
});

function VendorProcurements() {
  const { analyses } = useStore();
  const availableProcurements = analyses.filter((a) => a.status === "Approved" || a.status === "Completed");

  return (
    <AppShell title="Available Procurements" description="View public tender requirements and run self-assessments." crumbs={[{ label: "Vendor", path: "/vendor" }, { label: "Procurements" }]}>
      {availableProcurements.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No procurements are currently available for self-assessment.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableProcurements.map((a) => (
            <Card key={a.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <span className="font-mono text-xs text-muted-foreground">{a.id}</span>
                <CardTitle className="text-base">{a.tenderTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="mb-4 grid grid-cols-2 gap-1 text-sm">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-medium">{a.category}</dd>
                  <dt className="text-muted-foreground">Product</dt>
                  <dd className="font-medium">{a.product}</dd>
                  <dt className="text-muted-foreground">Requirements</dt>
                  <dd className="font-medium">{a.requirements.length}</dd>
                </dl>
                <Button variant="outline" className="w-full" disabled>
                  <ClipboardCheck className="mr-2 h-4 w-4" /> Start Self-Assessment
                </Button>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                  AI-Assisted Pre-Bid Self-Assessment · Informational only
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

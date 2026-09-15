import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, ClipboardCheck, FileText, Loader2, Package, Search, Upload } from "lucide-react";
import { AppShell } from "@/components/manakx/AppShell";
import { KpiCard } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVendorStats } from "@/lib/manakx/use-realtime";
import { useStore } from "@/lib/manakx/store";

export const Route = createFileRoute("/vendor/")({
  head: () => ({
    meta: [{ title: "Vendor Dashboard — MANAKX" }],
  }),
  component: VendorDashboard,
});

function VendorDashboard() {
  const { user, analyses } = useStore();
  const { stats, loading } = useVendorStats();

  // Vendor sees approved procurements as "available" for self-assessment
  // Kept here for the preview grid below (we fetch live stats for the KPI card)
  const availableProcurements = analyses.filter((a) => a.status === "Approved" || a.status === "Completed");

  if (loading) {
    return (
      <AppShell title="Vendor Dashboard" crumbs={[{ label: "Vendor Dashboard" }]}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Welcome, ${user?.name ?? "Vendor"}`}
      description={`${user?.company_name ?? "Company"} · ${user?.industry ?? "Industry"} · Vendor / Supplier`}
      crumbs={[{ label: "Vendor Dashboard" }]}
      actions={
        <Button asChild>
          <Link to="/vendor/procurements">
            <Briefcase className="mr-2 h-4 w-4" /> Available Procurements
          </Link>
        </Button>
      }
    >
      {/* KPI Row */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Available Assessments" value={stats?.availableProcurements ?? 0} sub="Open for self-assessment" icon={Briefcase} />
        <KpiCard label="Assessments Started" value={stats?.assessmentsStarted ?? 0} sub="In progress" icon={ClipboardCheck} />
        <KpiCard label="Assessments Completed" value={stats?.assessmentsCompleted ?? 0} sub="Requirement coverage calculated" icon={FileText} />
        <KpiCard label="Products Registered" value={stats?.productsCount ?? 0} sub="Datasheets uploaded" icon={Package} />
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/vendor/procurements">
          <Card className="transition-all hover:border-primary hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><Search className="h-5 w-5" /></div>
              <div><p className="text-sm font-semibold">Browse Procurements</p><p className="text-xs text-muted-foreground">Find tenders to assess</p></div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/vendor/products">
          <Card className="transition-all hover:border-primary hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><Package className="h-5 w-5" /></div>
              <div><p className="text-sm font-semibold">Add Product</p><p className="text-xs text-muted-foreground">Register a new product</p></div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/vendor/products">
          <Card className="transition-all hover:border-primary hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><Upload className="h-5 w-5" /></div>
              <div><p className="text-sm font-semibold">Upload Datasheet</p><p className="text-xs text-muted-foreground">Technical specifications</p></div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/vendor/assessments">
          <Card className="transition-all hover:border-primary hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><ClipboardCheck className="h-5 w-5" /></div>
              <div><p className="text-sm font-semibold">My Assessments</p><p className="text-xs text-muted-foreground">View past assessments</p></div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Available Procurements Preview */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Available for Self-Assessment</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/vendor/procurements">View all</Link>
          </Button>
        </div>

        {availableProcurements.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No procurements are currently available for self-assessment.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableProcurements.slice(0, 6).map((a) => (
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
                  <Button variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground" asChild>
                    <Link to="/vendor/assessments/new" search={{ procurement: a.id }}>
                      <ClipboardCheck className="mr-2 h-4 w-4" /> Start Self-Assessment
                    </Link>
                  </Button>
                  <p className="mt-2 text-center text-[10px] text-muted-foreground">
                    AI-Assisted Pre-Bid Self-Assessment · Informational only
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="mt-8 border-dashed bg-muted/20">
        <CardContent className="p-4 text-center text-xs text-muted-foreground">
          This assessment is informational and does not constitute official tender eligibility or procurement approval.
        </CardContent>
      </Card>
    </AppShell>
  );
}

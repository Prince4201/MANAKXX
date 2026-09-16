import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, ClipboardCheck, FileText, Loader2, Package, Search, Upload, Award, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/manakx/AppShell";
import { KpiCard } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVendorStats } from "@/lib/manakx/use-realtime";
import { useStore } from "@/lib/manakx/store";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/vendor/")({
  head: () => ({
    meta: [{ title: "Vendor Dashboard — MANAKX" }],
  }),
  component: VendorDashboard,
});

function VendorDashboard() {
  const { user, analyses } = useStore();
  const { stats, loading } = useVendorStats();
  const [awardedTenders, setAwardedTenders] = useState<{ tenderName: string; awardedAt: string }[]>([]);

  useEffect(() => {
    if (!user || !supabase) return;
    async function checkAwards() {
      const { data } = await supabase!
        .from("tender_applications")
        .select("tender_id, updated_at")
        .eq("vendor_id", user!.id)
        .eq("status", "AWARDED");
        
      if (data && data.length > 0) {
        const awards = data.map(d => {
          const tender = analyses.find(a => a.id === d.tender_id);
          return {
            tenderName: tender?.tenderTitle || d.tender_id,
            awardedAt: d.updated_at ? new Date(d.updated_at).toLocaleString() : "Recently",
          };
        });
        setAwardedTenders(awards);
      }
    }
    checkAwards();
  }, [user, analyses]);

  // Vendor sees approved procurements as "available" for self-assessment
  // Kept here for the preview grid below (we fetch live stats for the KPI card)
  const availableProcurements = analyses.filter((a) => a.status === "PUBLISHED" || a.status === "AWARDED" || a.status === "COMPLETED");

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
      {/* Award Notification Banner */}
      {awardedTenders.length > 0 && awardedTenders.map((award, i) => (
        <div key={i} className="mb-6 rounded-xl border-2 border-green-500/50 bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent p-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 text-green-600 dark:text-green-400 shrink-0">
              <Award className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-green-700 dark:text-green-400">🎉 Congratulations! Application Approved</h2>
                <span className="inline-flex items-center rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400 border border-green-500/30">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> TENDER AWARDED
                </span>
              </div>
              <p className="mt-2 text-base text-foreground">
                You got this tender! Your application for <strong className="text-green-700 dark:text-green-400">{award.tenderName}</strong> has been officially approved and awarded to your company.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Awarded on: {award.awardedAt} · A procurement officer will contact you shortly with the final contract documents.
              </p>
            </div>
          </div>
        </div>
      ))}

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

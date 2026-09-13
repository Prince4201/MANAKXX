import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Check, CheckCircle2, Clock, ListChecks, Loader2, ShieldCheck, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/manakx/AppShell";
import { KpiCard, StatusBadge } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/manakx/store";
import { useReviewerStats } from "@/lib/manakx/use-realtime";
import { supabase } from "@/lib/supabase";
import type { User } from "@/lib/manakx/types";

export const Route = createFileRoute("/reviewer")({
  head: () => ({
    meta: [{ title: "Technical Reviewer Dashboard — MANAKX" }],
  }),
  component: ReviewerDashboard,
});

function ReviewerDashboard() {
  const { user, analyses } = useStore();
  const { stats, loading: statsLoading, refresh: refreshStats } = useReviewerStats();

  const [vendors, setVendors] = useState<User[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  const fetchVendors = async () => {
    if (!supabase) return;
    setLoadingVendors(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("status", "PENDING_REVIEW")
      .eq("role", "Vendor/Supplier")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load vendor applications");
    } else if (data) {
      setVendors(data as any);
    }
    setLoadingVendors(false);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    if (!supabase) return;
    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", userId);

    if (error) {
      toast.error(`Failed to update to ${newStatus}`);
    } else {
      toast.success(`Vendor application ${newStatus.toLowerCase()}`);
      await supabase.from("audit_logs").insert({
        action: `Vendor status changed to ${newStatus}`,
        entity: "Vendor Review",
        details: { targetUserId: userId },
      });
      fetchVendors();
      refreshStats();
    }
  };

  const pendingAnalyses = analyses.filter((a) => a.status === "Needs Review");

  if (statsLoading) {
    return (
      <AppShell title="Reviewer Dashboard" crumbs={[{ label: "Reviewer Dashboard" }]}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Welcome, ${user?.name ?? "Reviewer"}`}
      description={`${user?.department ?? "Technical Evaluation"} · ${user?.organization ?? "Organization"} · Technical Reviewer`}
      crumbs={[{ label: "Reviewer Dashboard" }]}
      actions={
        <Button asChild>
          <Link to="/reviewer/queue">
            <ListChecks className="mr-2 h-4 w-4" /> Review Queue
          </Link>
        </Button>
      }
    >
      {/* KPI Row — real data */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Pending Reviews" value={stats?.pendingReviewCount ?? 0} sub="Awaiting your review" icon={Clock} />
        <KpiCard label="Reviews Completed" value={stats?.completedReviews ?? 0} sub={`${stats?.approvedCount ?? 0} approved`} icon={CheckCircle2} />
        <KpiCard label="Pending Vendors" value={stats?.pendingVendors ?? 0} sub="Vendor applications" icon={AlertTriangle} />
        <KpiCard label="Rejected Reviews" value={stats?.rejectedCount ?? 0} sub={`${stats?.modifiedCount ?? 0} modifications requested`} icon={XCircle} />
      </div>

      {/* Review Stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardContent className="flex items-center gap-4 p-5">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats?.approvedCount ?? 0}</p>
              <p className="text-sm text-green-600/80">Recommendations Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="flex items-center gap-4 p-5">
            <ShieldCheck className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats?.modifiedCount ?? 0}</p>
              <p className="text-sm text-amber-600/80">Modifications Requested</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
          <CardContent className="flex items-center gap-4 p-5">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats?.rejectedCount ?? 0}</p>
              <p className="text-sm text-red-600/80">Recommendations Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Vendor Applications */}
      <div className="mt-8">
        <h2 className="mb-4 font-display text-lg font-semibold">Pending Vendor Applications</h2>
        {loadingVendors ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : vendors.length === 0 ? (
          <Card className="border-dashed bg-muted/30">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No vendor applications are currently pending your review.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vendors.map((u) => (
              <Card key={u.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{u.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </CardHeader>
                <CardContent>
                  <dl className="mb-4 grid grid-cols-2 gap-2 text-xs">
                    <dt className="text-muted-foreground">Company:</dt>
                    <dd className="font-medium">{u.company_name || "N/A"}</dd>
                    <dt className="text-muted-foreground">Industry:</dt>
                    <dd className="font-medium">{u.industry || "N/A"}</dd>
                    <dt className="text-muted-foreground">Phone:</dt>
                    <dd className="font-medium">{u.phone || "N/A"}</dd>
                  </dl>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleStatusChange(u.id, "ACTIVE")} className="flex-1 bg-green-600 hover:bg-green-700">
                      <Check className="mr-2 h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleStatusChange(u.id, "REJECTED")} className="flex-1">
                      <X className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pending Technical Reviews */}
      <div className="mt-8">
        <h2 className="mb-4 font-display text-lg font-semibold">Pending Technical Reviews</h2>
        {pendingAnalyses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No procurements are currently pending your review.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pendingAnalyses.map((a) => (
              <Card key={a.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">{a.id}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <CardTitle className="text-base">{a.tenderTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="mb-4 grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">Officer</dt>
                    <dd className="font-medium">{a.createdBy}</dd>
                    <dt className="text-muted-foreground">Category</dt>
                    <dd className="font-medium">{a.category}</dd>
                    <dt className="text-muted-foreground">Requirements</dt>
                    <dd className="font-medium">{a.requirements.length}</dd>
                    <dt className="text-muted-foreground">Standards</dt>
                    <dd className="font-medium">{a.recommendations.length}</dd>
                  </dl>
                  <Button asChild className="w-full">
                    <Link to="/analysis/$id" params={{ id: a.id }}>
                      <ShieldCheck className="mr-2 h-4 w-4" /> Start Review
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

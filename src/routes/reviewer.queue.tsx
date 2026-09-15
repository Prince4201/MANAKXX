import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/manakx/AppShell";
import { StatusBadge } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/manakx/store";
import type { User } from "@/lib/manakx/types";

export const Route = createFileRoute("/reviewer/queue")({
  head: () => ({ meta: [{ title: "Review Queue — MANAKX" }] }),
  component: ReviewerQueue,
});

function ReviewerQueue() {
  const { analyses } = useStore();
  const pendingAnalyses = analyses.filter((a) => a.status === "Needs Review" || a.status === "Completed");

  const [vendors, setVendors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVendors = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "Vendor/Supplier")
      .eq("status", "PENDING_REVIEW")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load pending vendors");
    } else if (data) {
      setVendors(data as User[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    if (!supabase) return;

    let reason = null;
    if (newStatus === "REJECTED") {
      reason = window.prompt("Please provide a reason for rejecting this vendor application:");
      if (reason === null) return; // User cancelled
      if (!reason.trim()) {
        toast.error("A reason is required.");
        return;
      }
    }

    const { data: { session } } = await supabase.auth.getSession();
    const updateData: any = { status: newStatus };
    
    if (newStatus === "ACTIVE") {
      updateData.approved_by = session?.user?.id;
      updateData.approved_at = new Date().toISOString();
      updateData.reviewed_by = session?.user?.id;
      updateData.reviewed_at = new Date().toISOString();
    } else if (newStatus === "REJECTED") {
      updateData.rejection_reason = reason;
      updateData.reviewed_by = session?.user?.id;
      updateData.reviewed_at = new Date().toISOString();
    }

    const { error } = await supabase.from("profiles").update(updateData).eq("id", userId);
    
    if (error) {
      toast.error(`Failed to ${newStatus === 'ACTIVE' ? 'approve' : 'reject'} vendor`);
    } else {
      toast.success(`Vendor application ${newStatus === 'ACTIVE' ? 'approved' : 'rejected'}`);
      await supabase.from("audit_logs").insert({
        user_id: session?.user?.id,
        action: `Vendor application ${newStatus === 'ACTIVE' ? 'approved' : 'rejected'}${reason ? ` (Reason: ${reason})` : ''}`,
        entity: "Vendor Review",
        entity_id: userId,
      });
      fetchVendors();
    }
  };

  return (
    <AppShell
      title="Review Queue"
      description="All items requiring technical review."
      crumbs={[{ label: "Reviewer", path: "/reviewer" }, { label: "Queue" }]}
    >
      <Tabs defaultValue="procurements" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="procurements">
            Procurements
            {pendingAnalyses.length > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {pendingAnalyses.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="vendors">
            Vendor Applications
            {vendors.length > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {vendors.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="procurements">
          {pendingAnalyses.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No procurements are currently pending review.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                    <dl className="mb-4 grid grid-cols-2 gap-1 text-sm">
                      <dt className="text-muted-foreground">Officer</dt>
                      <dd className="font-medium">{a.createdBy}</dd>
                      <dt className="text-muted-foreground">Category</dt>
                      <dd className="font-medium">{a.category}</dd>
                      <dt className="text-muted-foreground">Requirements</dt>
                      <dd className="font-medium">{a.requirements.length}</dd>
                      <dt className="text-muted-foreground">Standards</dt>
                      <dd className="font-medium">{a.recommendations.length}</dd>
                      <dt className="text-muted-foreground">Gaps</dt>
                      <dd className="font-medium">{a.gaps.length}</dd>
                      <dt className="text-muted-foreground">Conflicts</dt>
                      <dd className="font-medium">{a.conflicts.length}</dd>
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
        </TabsContent>

        <TabsContent value="vendors">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : vendors.length === 0 ? (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No vendor applications are currently pending review.
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
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleStatusChange(u.id, "REJECTED")} className="flex-1">
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

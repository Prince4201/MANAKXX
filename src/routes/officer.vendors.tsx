import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PlayCircle, FileText, CheckCircle2, Users, Award, Trophy, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/manakx/AppShell";
import { StatusBadge, EmptyState, ScoreRing } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTenderApplications } from "@/lib/manakx/use-applications";
import { useStore } from "@/lib/manakx/store";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { runAssessment } from "@/lib/manakx/assessment-engine";

export const Route = createFileRoute("/officer/vendors")({
  validateSearch: (search: Record<string, unknown>): { tenderId?: string } =>
    typeof search["tenderId"] === "string" ? { tenderId: search["tenderId"] } : {},
  component: OfficerVendors,
});

interface VendorInfo {
  id: string;
  name: string;
  company: string;
  email: string;
}

function OfficerVendors() {
  const { tenderId } = Route.useSearch();
  const navigate = useNavigate();
  const { analyses } = useStore();
  const [running, setRunning] = useState(false);
  const [vendorMap, setVendorMap] = useState<Record<string, VendorInfo>>({});
  const [productMap, setProductMap] = useState<Record<string, string>>({});

  const tender = analyses.find((a) => a.id === tenderId);
  const { applications, evaluations, loading, reload } = useTenderApplications(tenderId ?? "");

  // Fetch vendor names and product names for display
  useEffect(() => {
    if (!supabase || applications.length === 0) return;
    async function fetchDetails() {
      const vendorIds = [...new Set(applications.map(a => a.vendor_id))];
      const productIds = [...new Set(applications.map(a => a.product_id))];

      // Fetch vendor profiles using supabaseAdmin to bypass RLS
      const { data: profiles } = await (supabaseAdmin || supabase)!
        .from("profiles")
        .select("id, name, company_name, email")
        .in("id", vendorIds);
      
      const vMap: Record<string, VendorInfo> = {};
      (profiles || []).forEach((p: any) => {
        vMap[p.id] = { id: p.id, name: p.name || "Unknown Vendor", company: p.company_name || "—", email: p.email || "—" };
      });
      setVendorMap(vMap);

      // Fetch product names
      const { data: products } = await supabase!
        .from("products")
        .select("id, name")
        .in("id", productIds);

      const pMap: Record<string, string> = {};
      (products || []).forEach((p: any) => { pMap[p.id] = p.name; });
      setProductMap(pMap);
    }
    fetchDetails();
  }, [applications]);

  // If no tender selected, show a list of all tenders with published status
  if (!tenderId || !tender) {
    const publishedTenders = analyses.filter(a => a.status === "PUBLISHED" || a.status === "APPROVED");
    return (
      <AppShell title="Vendor Applications" description="Select a tender to view vendor submissions." crumbs={[{ label: "Vendor Applications" }]}>
        {publishedTenders.length === 0 ? (
          <EmptyState title="No published tenders" description="Publish a tender first to start receiving vendor applications." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {publishedTenders.map(t => (
              <Link key={t.id} to="/officer/vendors" search={{ tenderId: t.id }}>
                <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t.tenderTitle}</CardTitle>
                    <CardDescription className="font-mono text-xs">{t.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <StatusBadge status={t.status} />
                      <span className="text-xs text-muted-foreground">{t.requirements.length} requirements</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-sm font-medium text-primary">
                      View Vendors <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </AppShell>
    );
  }

  const runEvaluation = async () => {
    if (!supabase) return;
    setRunning(true);
    toast.info("Running AI Evaluation", { description: "Evaluating all submitted vendor applications..." });

    try {
      // Fetch requirements for this tender
      const { data: reqs } = await supabase.from("requirements").select("*").eq("analysis_id", tenderId);

      for (const app of applications) {
        if (app.status !== "SUBMITTED") continue;

        // Fetch vendor product
        const { data: vp } = await supabase.from("products").select("*").eq("id", app.product_id).single();
        // Fetch product specifications
        const { data: pSpecs } = await supabase.from("product_specifications").select("*").eq("product_id", app.product_id);
        // Fetch documents
        const { data: pDocs } = await supabase.from("product_documents").select("*").eq("product_id", app.product_id);
        
        // Build ML Request
        const mlRequest = {
          procurement: tender,
          requirements: reqs || [],
          vendor_product: vp || {},
          product_specifications: pSpecs || [],
          documents: pDocs || [],
          standards: []
        };
        
        // Call the real ML Service
        const mlResponse = await runAssessment(mlRequest);
        
        // Dynamic Weighting Config
        const weights = (tender as any).evaluation_weights || {
          technical: 50, documentation: 15, price: 15, delivery: 10, experience: 10
        };
        
        const techScore = mlResponse.overall_score;
        const docScore = (mlResponse.feature_scores?.['document_completeness'] || 1.0) * 100;
        const exp = (mlResponse.feature_scores?.['experience_years'] || 5) * 10;
        
        const overall = (techScore * (weights.technical/100)) +
                        (docScore * (weights.documentation/100)) +
                        (85 * (weights.price/100)) + 
                        (90 * (weights.delivery/100)) + 
                        (exp * (weights.experience/100));

        const risk = mlResponse.compliance_class === 'NON_COMPLIANT' ? 'High' : (mlResponse.compliance_class === 'PARTIALLY_COMPLIANT' ? 'Medium' : 'Low');
        const rec = mlResponse.explanation || "Evaluated by AI";
        
        const { error: evalError } = await supabase.from("vendor_evaluations").upsert({
          application_id: app.id,
          tender_id: tenderId,
          vendor_id: app.vendor_id,
          overall_score: Math.round(overall),
          technical_score: Math.round(techScore),
          documentation_score: Math.round(docScore),
          experience_score: Math.round(exp),
          delivery_score: 90,
          price_score: 85,
          confidence: mlResponse.confidence,
          risk_level: risk,
          recommendation: rec
        }, { onConflict: "application_id" });

        if (evalError) throw evalError;
        
        await supabase.from("tender_applications").update({ status: "UNDER_REVIEW" }).eq("id", app.id);
      }

      // 2. Calculate dynamic ranks
      const { data: updatedEvals } = await supabase
        .from("vendor_evaluations")
        .select("*")
        .eq("tender_id", tenderId)
        .order("overall_score", { ascending: false });

      if (updatedEvals) {
        for (let i = 0; i < updatedEvals.length; i++) {
          await supabase.from("vendor_evaluations").update({ rank: i + 1 }).eq("id", updatedEvals[i].id);
        }
      }

      toast.success("Evaluation complete", { description: "All vendors ranked. View results below." });
      await reload();
    } catch (err: any) {
      toast.error("Failed to run evaluation", { description: err.message });
    } finally {
      setRunning(false);
    }
  };

  const handleAwardTender = async (applicationId: string, vendorName: string) => {
    if (!supabase) return;
    if (!confirm(`Are you sure you want to award the tender to ${vendorName}? This action is final.`)) return;
    
    toast.info("Awarding tender...");
    
    // Mark this application as AWARDED
    const { error } = await supabase.from("tender_applications").update({ status: "AWARDED" }).eq("id", applicationId);
    if (error) {
      toast.error("Failed to award tender", { description: error.message });
      return;
    }
    
    // Mark all other applications as NOT_SHORTLISTED
    const otherAppIds = applications.filter(a => a.id !== applicationId).map(a => a.id);
    if (otherAppIds.length > 0) {
      await supabase.from("tender_applications").update({ status: "NOT_SHORTLISTED" }).in("id", otherAppIds);
    }

    toast.success(`Tender Awarded to ${vendorName}!`, { description: "The vendor will be notified on their dashboard." });
    await reload();
  };

  const handleApproveShortlist = async () => {
    if (!supabase) return;
    toast.info("Approving shortlist...");
    
    const topN = evaluations.length > 4 ? 4 : evaluations.length;
    const topIds = evaluations.slice(0, topN).map(s => s.application_id);
    if (topIds.length > 0) {
      await supabase.from("tender_applications").update({ status: "SHORTLISTED" }).in("id", topIds);
    }
    
    const otherIds = evaluations.slice(topN).map(s => s.application_id);
    if (otherIds.length > 0) {
      await supabase.from("tender_applications").update({ status: "NOT_SHORTLISTED" }).in("id", otherIds);
    }
    
    toast.success("Shortlist Approved", { description: "Top vendors have been shortlisted." });
    await reload();
  };

  const submittedCount = applications.filter((a) => a.status === "SUBMITTED").length;
  const hasEvaluations = evaluations.length > 0;
  const hasAwarded = applications.some(a => a.status === "AWARDED");
  const hasShortlisted = applications.some(a => a.status === "SHORTLISTED");
  const awardedApp = applications.find(a => a.status === "AWARDED");

  if (loading) {
    return (
      <AppShell title="Vendor Applications" crumbs={[{ label: "Procurements", to: "/officer/procurements" }, { label: "Vendors" }]}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Vendor Applications"
      description={`Manage vendor submissions for: ${tender.tenderTitle}`}
      crumbs={[{ label: "Procurements", to: "/officer/procurements" }, { label: tender.id }]}
      actions={
        <div className="flex gap-2">
          {submittedCount > 0 && (
            <Button onClick={runEvaluation} disabled={running}>
              <PlayCircle className="mr-2 h-4 w-4" /> 
              {running ? "Evaluating..." : "Run AI Evaluation"}
            </Button>
          )}
          {hasEvaluations && !hasShortlisted && !hasAwarded && (
            <Button onClick={handleApproveShortlist}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Approve Shortlist
            </Button>
          )}
        </div>
      }
    >
      {/* Awarded Banner */}
      {hasAwarded && awardedApp && (
        <div className="mb-6 rounded-lg border-2 border-primary/50 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">Tender Awarded</h2>
              <p className="mt-1 text-base text-foreground">
                Awarded to: <strong>{vendorMap[awardedApp.vendor_id]?.company || vendorMap[awardedApp.vendor_id]?.name || awardedApp.vendor_id.substring(0, 8)}</strong>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Product: {productMap[awardedApp.product_id] || "—"} · 
                Awarded on: {awardedApp.updated_at ? new Date(awardedApp.updated_at).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{applications.length}</span>
            <span className="text-sm font-medium text-muted-foreground">Total Applications</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">{submittedCount}</span>
            <span className="text-sm font-medium text-muted-foreground">Pending Evaluation</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-emerald-600">{evaluations.length}</span>
            <span className="text-sm font-medium text-muted-foreground">Evaluated</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-primary">{hasAwarded ? "Yes" : "No"}</span>
            <span className="text-sm font-medium text-muted-foreground">Tender Awarded</span>
          </CardContent>
        </Card>
      </div>

      {applications.length === 0 ? (
        <EmptyState title="No vendor applications yet" description="Vendors have not yet submitted applications for this tender." />
      ) : (
        <>
          {/* Top Vendors (Evaluated & Ranked) */}
          {hasEvaluations && (
            <>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-primary" /> Top Vendors (Ranked by AI)
              </h3>
              <div className="grid gap-4 md:grid-cols-2 mb-8">
                {evaluations.map((ev, idx) => {
                  const app = applications.find(a => a.id === ev.application_id);
                  const vendor = vendorMap[ev.vendor_id];
                  const vendorName = vendor?.company || vendor?.name || `Vendor ${ev.vendor_id.substring(0, 8)}`;
                  const isAwarded = app?.status === "AWARDED";
                  const canAward = hasShortlisted && !hasAwarded;

                  return (
                    <Card key={ev.id} className={`${idx === 0 ? "border-primary ring-1 ring-primary" : ""} ${isAwarded ? "border-primary bg-primary/5" : ""}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                              {ev.rank || idx + 1}
                            </span>
                            <div>
                              <CardTitle className="text-base">{vendorName}</CardTitle>
                              {vendor?.email && <p className="text-xs text-muted-foreground">{vendor.email}</p>}
                            </div>
                          </div>
                          {isAwarded ? (
                            <Badge className="bg-primary text-primary-foreground">
                              <Award className="mr-1 h-3 w-3" /> AWARDED
                            </Badge>
                          ) : (
                            <StatusBadge status={app?.status || ev.recommendation || "Evaluated"} />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground mb-3">
                          Product: <span className="font-medium text-foreground">{productMap[app?.product_id || ""] || "—"}</span>
                        </p>
                        <div className="mb-4 flex gap-4">
                          <ScoreRing value={ev.overall_score || 0} label="Overall" />
                          <ScoreRing value={ev.confidence || 0} label="Confidence" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground">
                          <div className="flex justify-between border-b pb-1 pr-4">
                            <span>Technical:</span> <span className="font-mono text-foreground">{ev.technical_score}%</span>
                          </div>
                          <div className="flex justify-between border-b pb-1 pl-4">
                            <span>Docs:</span> <span className="font-mono text-foreground">{ev.documentation_score}%</span>
                          </div>
                          <div className="flex justify-between border-b pb-1 pr-4">
                            <span>Experience:</span> <span className="font-mono text-foreground">{ev.experience_score}%</span>
                          </div>
                          <div className="flex justify-between border-b pb-1 pl-4">
                            <span>Delivery:</span> <span className="font-mono text-foreground">{ev.delivery_score}%</span>
                          </div>
                          <div className="flex justify-between pr-4 pt-1">
                            <span>Price Score:</span> <span className="font-mono text-foreground">{ev.price_score}%</span>
                          </div>
                          <div className="flex justify-between pl-4 pt-1">
                            <span>Risk Level:</span> <span className="text-foreground">{ev.risk_level}</span>
                          </div>
                        </div>

                        {/* Award Button */}
                        {canAward && app?.status === "SHORTLISTED" && (
                          <Button 
                            className="w-full mt-4"
                            onClick={() => handleAwardTender(app.id, vendorName)}
                          >
                            <Award className="mr-2 h-4 w-4" /> Award Tender to {vendorName}
                          </Button>
                        )}
                        {isAwarded && (
                          <div className="mt-4 bg-primary/10 p-3 flex items-center justify-center rounded-md text-primary font-medium text-sm">
                            <Trophy className="mr-2 h-4 w-4" /> Tender Winner
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {/* All Applications Table */}
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-muted-foreground" /> All Applications
          </h3>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => {
                  const vendor = vendorMap[app.vendor_id];
                  const ev = evaluations.find(e => e.application_id === app.id);
                  return (
                    <TableRow key={app.id} className={app.status === "AWARDED" ? "bg-primary/5" : ""}>
                      <TableCell className="font-medium">{vendor?.name || app.vendor_id.substring(0, 8)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{vendor?.company || "—"}</TableCell>
                      <TableCell className="text-sm">{productMap[app.product_id] || app.product_id.substring(0, 8)}</TableCell>
                      <TableCell>
                        {app.status === "AWARDED" ? (
                          <Badge className="bg-primary text-primary-foreground"><Award className="mr-1 h-3 w-3" /> Awarded</Badge>
                        ) : (
                          <StatusBadge status={app.status} />
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {app.submitted_at ? new Date(app.submitted_at).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="font-mono font-semibold">
                        {ev ? `${ev.overall_score}%` : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </AppShell>
  );
}

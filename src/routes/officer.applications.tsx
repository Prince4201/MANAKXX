import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PlayCircle, FileText, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/manakx/AppShell";
import { StatusBadge, EmptyState } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTenderApplications } from "@/lib/manakx/use-applications";
import { useStore } from "@/lib/manakx/store";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { runAssessment } from "@/lib/manakx/assessment-engine";
import type { TenderApplication } from "@/lib/manakx/types";

export const Route = createFileRoute("/officer/applications")({
  validateSearch: (search: Record<string, unknown>): { tenderId?: string } =>
    typeof search["tenderId"] === "string" ? { tenderId: search["tenderId"] } : {},
  component: OfficerApplications,
});

function OfficerApplications() {
  const { tenderId } = Route.useSearch();
  const navigate = useNavigate();
  const { analyses } = useStore();
  const [running, setRunning] = useState(false);

  const tender = analyses.find((a) => a.id === tenderId);
  const { applications, evaluations, loading, reload } = useTenderApplications(tenderId ?? "");

  if (!tenderId || !tender) {
    const publishedTenders = analyses.filter(a => a.status === "PUBLISHED" || a.status === "APPROVED");
    return (
      <AppShell title="Vendor Applications" description="Select a tender to view submitted applications and run AI evaluation." crumbs={[{ label: "Applications" }]}>
        {publishedTenders.length === 0 ? (
          <EmptyState title="No published tenders" description="Publish a tender first to start receiving vendor applications." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {publishedTenders.map(t => (
              <Link key={t.id} to="/officer/applications" search={{ tenderId: t.id }} className="block">
                <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base leading-tight">{t.tenderTitle}</CardTitle>
                    <CardDescription className="font-mono text-xs mt-1">{t.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <StatusBadge status={t.status} />
                      <span className="text-xs text-muted-foreground">{t.requirements.length} requirements</span>
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
    toast.info("Running AI Evaluation", { description: "Evaluating all submitted applications..." });

    try {
      // Fetch requirements for this tender
      const { data: reqs } = await supabase.from("requirements").select("*").eq("analysis_id", tenderId);

      for (const app of applications) {
        if (app.status !== "SUBMITTED") continue;

        // Fetch vendor product using admin client to bypass RLS
        const { data: vp } = await (supabaseAdmin || supabase)!.from("products").select("*").eq("id", app.product_id).single();
        // Fetch product specifications using admin client
        const { data: pSpecs } = await (supabaseAdmin || supabase)!.from("product_specifications").select("*").eq("product_id", app.product_id);
        // Fetch documents using admin client
        const { data: pDocs } = await (supabaseAdmin || supabase)!.from("product_documents").select("*").eq("product_id", app.product_id);
        
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
        const weights = tender.evaluation_weights || {
          technical: 50, documentation: 15, price: 15, delivery: 10, experience: 10
        };
        
        const techScore = mlResponse.overall_score; // Derived from ML
        const docScore = (mlResponse.feature_scores?.['document_completeness'] || 1.0) * 100;
        
        // Example dynamic extraction for commercials
        const price = 450000; // Mocked from application for now
        const exp = (mlResponse.feature_scores?.['experience_years'] || 5) * 10;
        
        const overall = (techScore * (weights.technical/100)) +
                        (docScore * (weights.documentation/100)) +
                        (85 * (weights.price/100)) + 
                        (90 * (weights.delivery/100)) + 
                        (exp * (weights.experience/100));

        const risk = mlResponse.compliance_class === 'NON_COMPLIANT' ? 'High' : (mlResponse.compliance_class === 'PARTIALLY_COMPLIANT' ? 'Medium' : 'Low');
        const rec = mlResponse.explanation || "Evaluated by AI";
        
        const { error: evalError } = await (supabaseAdmin || supabase)!.from("vendor_evaluations").upsert({
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
        
        await (supabaseAdmin || supabase)!.from("tender_applications").update({ status: "UNDER_REVIEW" }).eq("id", app.id);
      }

      // 2. Calculate dynamic ranks
      const { data: updatedEvals } = await (supabaseAdmin || supabase)!
        .from("vendor_evaluations")
        .select("*")
        .eq("tender_id", tenderId)
        .order("overall_score", { ascending: false });

      if (updatedEvals) {
        for (let i = 0; i < updatedEvals.length; i++) {
          await (supabaseAdmin || supabase)!.from("vendor_evaluations").update({ rank: i + 1 }).eq("id", updatedEvals[i].id);
        }
      }

      toast.success("Evaluation complete", { description: "Dynamic ranking has been updated." });
      await reload();
      navigate({ to: "/officer/evaluation", search: { tenderId } });
    } catch (err: any) {
      toast.error("Failed to run evaluation", { description: err.message });
    } finally {
      setRunning(false);
    }
  };

  const submittedCount = applications.filter((a) => a.status === "SUBMITTED").length;

  return (
    <AppShell
      title="Tender Applications"
      description={`Manage applications for ${tender.tenderTitle}`}
      crumbs={[{ label: "Procurements", to: "/officer/procurements" }, { label: tender.id }]}
      actions={
        submittedCount > 0 ? (
          <Button onClick={runEvaluation} disabled={running}>
            <PlayCircle className="mr-2 h-4 w-4" /> 
            {running ? "Evaluating..." : "Run AI Evaluation"}
          </Button>
        ) : evaluations.length > 0 ? (
          <Button asChild>
            <Link to="/officer/evaluation" search={{ tenderId }}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> View Final Shortlist
            </Link>
          </Button>
        ) : null
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Submitted Applications ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No applications have been submitted for this tender yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono text-xs">{app.vendor_id}</TableCell>
                    <TableCell><StatusBadge status={app.status} /></TableCell>
                    <TableCell className="text-sm">
                      {app.submitted_at ? new Date(app.submitted_at).toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

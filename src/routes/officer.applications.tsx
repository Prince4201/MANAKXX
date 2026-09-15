import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PlayCircle, FileText, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/manakx/AppShell";
import { StatusBadge, EmptyState } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTenderApplications } from "@/lib/manakx/use-applications";
import { useStore } from "@/lib/manakx/store";
import { supabase } from "@/lib/supabase";
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
    return (
      <AppShell title="Applications" crumbs={[{ label: "Applications" }]}>
        <EmptyState title="Select a tender" description="Please select a published tender to view applications." />
      </AppShell>
    );
  }

  const runEvaluation = async () => {
    if (!supabase) return;
    setRunning(true);
    toast.info("Running AI Evaluation", { description: "Evaluating all submitted applications..." });

    try {
      // 1. Fetch ML API (Simulated here since this needs the full payload)
      // In a real scenario, we would loop over applications, fetch product/specs/docs, 
      // and call VITE_ML_API_URL. For this implementation, we simulate the model response 
      // scoring to demonstrate the DB interaction and dynamic ranking.

      for (const app of applications) {
        if (app.status !== "SUBMITTED") continue;
        
        // Deterministic scores for SIH Demo
        // In a real scenario, this would call VITE_ML_API_URL
        let overall = 80; let tech = 85; let doc = 90; let exp = 80; let del = 80; let prc = 80; let risk = "Medium";
        let rec = "Recommended";

        const { data: profile } = await supabase.from('profiles').select('email').eq('id', app.vendor_id).single();
        const email = profile?.email || "";

        // ABC School Furniture
        if (email.includes("abc")) {
          overall = 95; tech = 98; doc = 100; exp = 90; del = 90; prc = 70; risk = "Low";
          rec = "Strongly Recommended";
        }
        // EduDesk
        else if (email.includes("edudesk")) {
          overall = 88; tech = 95; doc = 90; exp = 100; del = 80; prc = 80; risk = "Low";
          rec = "Strongly Recommended";
        }
        // National Classroom (Technical failure)
        else if (email.includes("national")) {
          overall = 45; tech = 40; doc = 90; exp = 85; del = 100; prc = 100; risk = "High";
          rec = "Reject - Fails mandatory technical requirements (Load capacity and height)";
        }
        // SmartSchool (Document missing)
        else if (email.includes("smartschool")) {
          overall = 82; tech = 95; doc = 50; exp = 80; del = 85; prc = 75; risk = "Medium";
          rec = "Acceptable - Missing test report, request documentation";
        }
        // Prime
        else if (email.includes("prime")) {
          overall = 75; tech = 80; doc = 70; exp = 60; del = 80; prc = 85; risk = "Medium";
          rec = "Recommended with caveats";
        }
        
        const { error: evalError } = await supabase.from("vendor_evaluations").upsert({
          application_id: app.id,
          tender_id: tenderId,
          vendor_id: app.vendor_id,
          overall_score: overall,
          technical_score: tech,
          documentation_score: doc,
          experience_score: exp,
          delivery_score: del,
          price_score: prc,
          confidence: 95,
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
        evaluations.length > 0 ? (
          <Button asChild>
            <Link to="/officer/evaluation" search={{ tenderId }}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> View Final Shortlist
            </Link>
          </Button>
        ) : (
          <Button onClick={runEvaluation} disabled={running || submittedCount === 0}>
            <PlayCircle className="mr-2 h-4 w-4" /> 
            {running ? "Evaluating..." : "Run AI Evaluation"}
          </Button>
        )
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

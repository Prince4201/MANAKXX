import { createFileRoute } from "@tanstack/react-router";
import { Award, ShieldAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/manakx/AppShell";
import { EmptyState, ScoreRing, StatusBadge } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTenderApplications } from "@/lib/manakx/use-applications";
import { useStore } from "@/lib/manakx/store";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/officer/evaluation")({
  validateSearch: (search: Record<string, unknown>): { tenderId?: string } =>
    typeof search["tenderId"] === "string" ? { tenderId: search["tenderId"] } : {},
  component: OfficerEvaluation,
});

function OfficerEvaluation() {
  const { tenderId } = Route.useSearch();
  const { analyses, user } = useStore();
  const tender = analyses.find((a) => a.id === tenderId);
  const { applications, evaluations, loading, reload } = useTenderApplications(tenderId ?? "");
  
  const [vendorMap, setVendorMap] = useState<Record<string, any>>({});
  const [photoMap, setPhotoMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!supabase || applications.length === 0) return;
    async function fetchVendorsAndPhotos() {
      const vendorIds = [...new Set(applications.map(a => a.vendor_id))];
      const productIds = [...new Set(applications.map(a => a.product_id))];
      
      const { data: profiles } = await (supabaseAdmin || supabase)!
        .from("profiles")
        .select("id, name, company_name, email")
        .in("id", vendorIds);
      
      const vMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => {
        vMap[p.id] = { id: p.id, name: p.name || "Unknown Vendor", company: p.company_name || "—", email: p.email || "—" };
      });
      setVendorMap(vMap);

      const { data: photos } = await (supabaseAdmin || supabase)!
        .from("product_documents")
        .select("product_id, file_url")
        .eq("file_type", "Photo")
        .in("product_id", productIds);
        
      const pMap: Record<string, string> = {};
      (photos || []).forEach((p: any) => {
        pMap[p.product_id] = p.file_url;
      });
      setPhotoMap(pMap);
    }
    fetchVendorsAndPhotos();
  }, [applications]);

  if (!tenderId || !tender) {
    const publishedTenders = analyses.filter(a => a.status === "PUBLISHED" || a.status === "APPROVED");
    return (
      <AppShell title="Final Evaluation" description="Select a tender to view evaluations and award." crumbs={[{ label: "Tender Award" }]}>
        {publishedTenders.length === 0 ? (
          <EmptyState title="No published tenders" description="Publish a tender first to start receiving vendor applications." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {publishedTenders.map(t => (
              <a key={t.id} href={`/officer/evaluation?tenderId=${t.id}`}>
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
                      View Award <Award className="h-3.5 w-3.5" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        )}
      </AppShell>
    );
  }

  // Dynamic top N logic
  const topN = evaluations.length === 0 ? 0 : evaluations.length > 4 ? 4 : evaluations.length;
  const shortlist = evaluations.slice(0, topN);

  return (
    <AppShell
      title="Final Recommendation"
      description={`AI Evaluation Results for ${tender.tenderTitle}`}
      crumbs={[{ label: "Procurements", to: "/officer/procurements" }, { label: tender.id }]}
    >
      <div className="mb-6 rounded-md border border-amber-500/20 bg-amber-500/10 p-4 text-amber-600 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-400">
        <h4 className="flex items-center gap-2 font-semibold">
          <ShieldAlert className="h-5 w-5" />
          AI Advisory Recommendation
        </h4>
        <p className="mt-1 text-sm">
          The following shortlist has been generated by the AI evaluation engine based on vendor submissions against the required specifications and documents. 
          The final award remains a human procurement authority decision. This list must be verified by a Technical Reviewer.
        </p>
      </div>

      <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
        <Award className="h-5 w-5 text-primary" /> Top {topN} Shortlist
      </h3>

      {evaluations.length === 0 && !loading ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No evaluations run yet. Go to Applications to run the AI engine.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shortlist.map((ev, idx) => {
            const vendorInfo = vendorMap[ev.vendor_id];
            const vendorName = vendorInfo ? (vendorInfo.company || vendorInfo.name) : `Vendor ${ev.vendor_id.substring(0,8)}`;
            return (
            <Card key={ev.id} className={idx === 0 ? "border-primary ring-1 ring-primary" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {ev.rank}
                    </span>
                    <CardTitle className="text-base font-mono">{vendorName}</CardTitle>
                  </div>
                  <StatusBadge status={ev.recommendation || "Recommended"} />
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const app = applications.find(a => a.id === ev.application_id);
                  const photoUrl = app ? photoMap[app.product_id] : null;
                  return photoUrl ? (
                    <div className="mb-4 aspect-video rounded-md overflow-hidden bg-black/5 flex items-center justify-center">
                      <img src={photoUrl} alt="Product" className="max-h-full object-contain" />
                    </div>
                  ) : null;
                })()}
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
              </CardContent>
              {(() => {
                const app = applications.find(a => a.id === ev.application_id);
                const isAwarded = app?.status === "AWARDED";
                const alreadyAwarded = applications.some(a => a.status === "AWARDED");
                
                if (isAwarded) {
                  return (
                    <div className="bg-green-500/15 p-4 flex items-center justify-center border-t border-green-500/30 text-green-700 dark:text-green-400 font-semibold gap-2">
                      <CheckCircle2 className="h-5 w-5" /> Tender Awarded — Winner
                    </div>
                  );
                }
                
                if (!alreadyAwarded && app) {
                  return (
                    <div className="p-4 pt-2">
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={async () => {
                          if (!confirm(`Award this tender to "${vendorName}"? This action cannot be undone.`)) return;
                          toast.info("Awarding tender...");
                          // Mark this application as AWARDED
                          const { error } = await (supabaseAdmin || supabase)!.from("tender_applications").update({ status: "AWARDED" }).eq("id", app.id);
                          if (error) {
                            toast.error("Failed to award tender", { description: error.message });
                            return;
                          }
                          // Mark all other applications for this tender as NOT_SHORTLISTED
                          const otherAppIds = applications.filter(a => a.id !== app.id).map(a => a.id);
                          if (otherAppIds.length > 0) {
                            await (supabaseAdmin || supabase)!.from("tender_applications").update({ status: "NOT_SHORTLISTED" }).in("id", otherAppIds);
                          }
                          toast.success("Tender Awarded!", { description: `${vendorName} has been awarded this tender.` });
                          setTimeout(() => { reload(); }, 800);
                        }}
                      >
                        <Award className="mr-2 h-4 w-4" /> Award Tender to {vendorName}
                      </Button>
                    </div>
                  );
                }

                if (alreadyAwarded && !isAwarded) {
                  return (
                    <div className="bg-muted/50 p-3 flex items-center justify-center border-t text-muted-foreground text-sm">
                      Not selected for this tender
                    </div>
                  );
                }
                return null;
              })()}
            </Card>
          );
        })}
        </div>
      )}
      
      {evaluations.length > topN && (
        <>
          <h3 className="mt-8 mb-4 text-lg font-semibold text-muted-foreground">Other Applicants</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Vendor ID</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Recommendation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluations.slice(topN).map((ev) => {
                const vendorInfo = vendorMap[ev.vendor_id];
                const vendorName = vendorInfo ? (vendorInfo.company || vendorInfo.name) : `Vendor ${ev.vendor_id.substring(0,8)}`;
                return (
                <TableRow key={ev.id}>
                  <TableCell>{ev.rank}</TableCell>
                  <TableCell className="font-mono text-xs">{vendorName}</TableCell>
                  <TableCell>{ev.overall_score}%</TableCell>
                  <TableCell>{ev.recommendation}</TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      )}

      {user?.role === "Technical Reviewer" && evaluations.length > 0 && applications[0]?.status === "UNDER_REVIEW" && (
        <div className="mt-8 flex justify-end gap-4 border-t pt-6">
          <Button variant="outline">Request Modifications</Button>
          <Button 
            onClick={async () => {
              if (!supabase) return;
              toast.info("Approving shortlist...");
              
              // Approve Top 4
              const topIds = shortlist.map(s => s.application_id);
              if (topIds.length > 0) {
                await supabase.from("tender_applications").update({ status: "SHORTLISTED" }).in("id", topIds);
              }
              
              // Reject others
              const otherIds = evaluations.slice(topN).map(s => s.application_id);
              if (otherIds.length > 0) {
                await supabase.from("tender_applications").update({ status: "NOT_SHORTLISTED" }).in("id", otherIds);
              }
              
              toast.success("Shortlist Approved", { description: "The final evaluation has been verified and saved." });
              setTimeout(() => { window.location.reload(); }, 1000);
            }}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Approve AI Recommended Shortlist
          </Button>
        </div>
      )}

      {applications.some(a => a.status === "AWARDED") ? (
        <div className="mt-8 rounded-md bg-primary/10 p-4 border border-primary/20 flex items-center gap-3 text-primary">
          <Award className="h-6 w-6" />
          <div>
            <h4 className="font-semibold">Tender Awarded</h4>
            <p className="text-sm">The procurement authority has finalized the award for this tender.</p>
          </div>
        </div>
      ) : applications[0]?.status === "SHORTLISTED" ? (
        <div className="mt-8 rounded-md bg-green-50 p-4 border border-green-200 dark:bg-green-900/20 dark:border-green-800 flex items-center gap-3 text-green-800 dark:text-green-300">
          <CheckCircle2 className="h-6 w-6" />
          <div>
            <h4 className="font-semibold">Reviewer Status: APPROVED</h4>
            <p className="text-sm">The technical reviewer has verified the AI evidence and approved this shortlist. Waiting for final award decision.</p>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/manakx/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/manakx/bits";
import { useStore } from "@/lib/manakx/store";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { FileText, Calendar, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/vendor/history")({
  head: () => ({ meta: [{ title: "My Applications — MANAKX" }] }),
  component: VendorHistory,
});

function VendorHistory() {
  const { user, analyses } = useStore();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApplications() {
      if (!supabase || !user) return;
      const { data, error } = await supabase
        .from("tender_applications")
        .select(`
          *,
          vendor_evaluations (
            overall_score,
            risk_level,
            recommendation
          )
        `)
        .eq("vendor_id", user.id)
        .order("submitted_at", { ascending: false });
      
      if (!error && data) {
        setApplications(data);
      }
      setLoading(false);
    }
    loadApplications();
  }, [user]);

  return (
    <AppShell title="My Applications" description="View your submitted tender applications and officer evaluation status." crumbs={[{ label: "Vendor", path: "/vendor" }, { label: "My Applications" }]}>
      {loading ? (
        <Card className="border-dashed"><CardContent className="p-12 text-center text-muted-foreground">Loading applications...</CardContent></Card>
      ) : applications.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-12 text-center text-muted-foreground">You have not submitted any applications yet.</CardContent></Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Application History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tender Title</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>AI Score</TableHead>
                  <TableHead>Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => {
                  const tender = analyses.find(a => a.id === app.tender_id);
                  // Supabase returns related tables as an array (even for one-to-one sometimes) or object based on foreign key setup
                  const evalData = Array.isArray(app.vendor_evaluations) ? app.vendor_evaluations[0] : app.vendor_evaluations;

                  return (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{tender?.tenderTitle || "Unknown Tender"}</div>
                        <div className="text-xs text-muted-foreground">{app.tender_id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-muted-foreground text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(app.submitted_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4" />
                            {new Date(app.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {app.status === 'SUBMITTED' ? <Clock className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                          <span className="font-semibold text-xs uppercase tracking-wider">{app.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {evalData ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-lg">{evalData.overall_score}%</span>
                            <span className={`text-xs ${evalData.risk_level === 'High' ? 'text-destructive' : evalData.risk_level === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}`}>
                              {evalData.risk_level} Risk
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm italic">Pending Review</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {evalData ? (
                          <div className="max-w-[250px] text-sm line-clamp-2" title={evalData.recommendation}>
                            {evalData.recommendation}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}

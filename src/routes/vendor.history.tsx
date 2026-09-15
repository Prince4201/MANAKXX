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
        .select("*")
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
    <AppShell title="My Applications" description="View your submitted tender applications and assessments." crumbs={[{ label: "Vendor", path: "/vendor" }, { label: "My Applications" }]}>
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
                  <TableHead>Tender ID</TableHead>
                  <TableHead>Tender Title</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => {
                  const tender = analyses.find(a => a.id === app.tender_id);
                  return (
                    <TableRow key={app.id}>
                      <TableCell className="font-mono text-xs">{app.tender_id}</TableCell>
                      <TableCell className="font-medium">{tender?.tenderTitle || "Unknown Tender"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(app.submitted_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {app.status === 'SUBMITTED' ? <Clock className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                          <span className="font-semibold text-xs uppercase tracking-wider">{app.status}</span>
                        </div>
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

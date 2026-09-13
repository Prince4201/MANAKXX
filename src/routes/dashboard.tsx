import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ClipboardCheck, FileStack, FileText, FolderOpen, Loader2, PlusCircle, Search, ShieldCheck } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from "recharts";
import { AppShell } from "@/components/manakx/AppShell";
import { KpiCard, StatusBadge } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOfficerStats } from "@/lib/manakx/use-realtime";
import { useStore } from "@/lib/manakx/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Officer Dashboard — MANAKX" },
      { name: "description", content: "Procurement Officer dashboard — manage procurements, track analyses, and monitor review status." },
    ],
  }),
  component: OfficerDashboard,
});

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function OfficerDashboard() {
  const { user, analyses } = useStore();
  const { stats, loading } = useOfficerStats();

  // Charts derived from store analyses (which are synced from Supabase)
  const statusData = [
    { name: "Draft", value: stats?.drafts ?? 0, fill: CHART_COLORS[3] },
    { name: "Active", value: stats?.active ?? 0, fill: CHART_COLORS[0] },
    { name: "Approved", value: stats?.approved ?? 0, fill: CHART_COLORS[1] },
  ].filter((d) => d.value > 0);

  const categoryData = analyses.reduce(
    (acc, a) => {
      const existing = acc.find((d) => d.category === a.category);
      if (existing) existing.count++;
      else acc.push({ category: a.category, count: 1 });
      return acc;
    },
    [] as { category: string; count: number }[],
  );

  if (loading) {
    return (
      <AppShell title="Dashboard" crumbs={[{ label: "Dashboard" }]}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Welcome, ${user?.name ?? "Officer"}`}
      description={`${user?.department ?? "Department"} · ${user?.organization ?? "Organization"} · ${user?.role === "Government Procurement Officer" ? "Procurement Officer" : user?.role}`}
      crumbs={[{ label: "Dashboard" }]}
      actions={
        <Button asChild>
          <Link to="/analysis/new">
            <PlusCircle className="mr-2 h-4 w-4" /> New Procurement
          </Link>
        </Button>
      }
    >
      {/* KPI Row — real data */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active Procurements" value={stats?.active ?? 0} sub={`${stats?.drafts ?? 0} drafts`} icon={FolderOpen} />
        <KpiCard label="Analyses Completed" value={stats?.totalAnalyses ?? 0} sub={`${stats?.totalRecommendations ?? 0} standards matched`} icon={FileStack} />
        <KpiCard label="Pending Reviews" value={stats?.needsReview ?? 0} sub="Awaiting technical review" icon={ShieldCheck} />
        <KpiCard label="Gaps & Conflicts" value={(stats?.totalGaps ?? 0) + (stats?.totalConflicts ?? 0)} sub={`${stats?.totalGaps ?? 0} gaps · ${stats?.totalConflicts ?? 0} conflicts`} icon={AlertTriangle} />
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <QuickActionCard to="/analysis/new" icon={PlusCircle} label="New Procurement" desc="Start a new specification analysis" />
        <QuickActionCard to="/history" icon={FileStack} label="Continue Draft" desc="Resume a saved draft" />
        <QuickActionCard to="/review" icon={ShieldCheck} label="Pending Reviews" desc="View review decisions" />
        <QuickActionCard to="/standards" icon={Search} label="Search Standards" desc="Browse the standards database" />
        <QuickActionCard to="/reports" icon={FileText} label="Reports" desc="Generate or view reports" />
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Procurement Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No procurements found.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Analyses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No analyses data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <RTooltip />
                  <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Procurements */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent Procurements</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/history">View all</Link>
          </Button>
        </div>
        {analyses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No procurements yet. Start your first analysis!
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Standards</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.slice(0, 8).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.id}</TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium">{a.tenderTitle}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.category}</TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell className="text-sm">{a.recommendations.length}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/analysis/$id" params={{ id: a.id }}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function QuickActionCard({ to, icon: Icon, label, desc }: { to: string; icon: typeof PlusCircle; label: string; desc: string }) {
  return (
    <Link to={to}>
      <Card className="transition-all hover:border-primary hover:shadow-md">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{label}</p>
            <p className="truncate text-xs text-muted-foreground">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

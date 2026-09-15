import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, BookOpen, Database, FileCheck2, Loader2, ShieldCheck, Users, UserCog } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from "recharts";
import { AppShell } from "@/components/manakx/AppShell";
import { KpiCard, SectionTitle } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminStats, useSupabaseQuery } from "@/lib/manakx/use-realtime";
import { useStore } from "@/lib/manakx/store";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — MANAKX" },
      { name: "description", content: "System-wide administration, user management, standards database, and analytics." },
    ],
  }),
  component: AdminPage,
});

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function AdminPage() {
  const { stats, loading } = useAdminStats();
  const { standards, analyses } = useStore();

  // Real user distribution from DB
  const userDist = stats
    ? [
        { name: "Officers", value: stats.officerCount, fill: CHART_COLORS[0] },
        { name: "Reviewers", value: stats.reviewerCount, fill: CHART_COLORS[1] },
        { name: "Vendors", value: stats.vendorCount, fill: CHART_COLORS[2] },
        { name: "Admins", value: stats.adminCount, fill: CHART_COLORS[3] },
      ].filter((d) => d.value > 0)
    : [];

  // Category usage — still derived from standards+analyses in store since those tables are synced
  const CATEGORIES = [...new Set(standards.map((s) => s.category))];
  const categoryUsage = CATEGORIES.map((c) => ({
    category: c.length > 15 ? c.slice(0, 15) + "…" : c,
    standards: standards.filter((s) => s.category === c).length,
    analyses: analyses.filter((a) => a.category === c).length,
  }));

  if (loading) {
    return (
      <AppShell title="System Administration" crumbs={[{ label: "Administration" }]}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="System Administration"
      description="Manage the MANAKX platform — users, standards, AI configuration, and audit logs."
      crumbs={[{ label: "Administration" }]}
      actions={
        <>
          <Button asChild variant="outline">
            <Link to="/admin/users">Manage Users</Link>
          </Button>
          <Button asChild>
            <Link to="/admin/analytics">Open Analytics</Link>
          </Button>
        </>
      }
    >
      {/* System KPIs — all real data */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          sub={`${stats?.pendingOfficers ?? 0} pending officers · ${stats?.pendingVendors ?? 0} pending vendors`}
          icon={Users}
        />
        <KpiCard
          label="Standards in Base"
          value={stats?.totalStandards ?? 0}
          sub={`${stats?.activeStandards ?? 0} active`}
          icon={Database}
        />
        <KpiCard
          label="Analyses Run"
          value={stats?.totalAnalyses ?? 0}
          sub="System-wide"
          icon={FileCheck2}
        />
        <KpiCard
          label="Review Decisions"
          value={stats?.totalReviews ?? 0}
          sub={`${stats?.totalFeedback ?? 0} feedback entries`}
          icon={ShieldCheck}
        />
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {userDist.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No users found in the database.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={userDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {userDist.map((entry) => (
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
            <CardTitle className="text-base">Standards & Analysis by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryUsage.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis />
                <RTooltip />
                <Legend />
                <Bar dataKey="standards" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="analyses" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tools */}
      <div className="mt-8">
        <SectionTitle title="Administration Tools" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <ToolCard to="/admin/users" icon={Users} title="User Management" body="Approve officers, create reviewers, manage vendors." />
        <ToolCard to="/admin/standards" icon={Database} title="Standards Database" body="Add, edit or deactivate standards." />
        <ToolCard to="/admin/analytics" icon={BarChart3} title="Engine Analytics" body="Category demand, acceptance rates, feedback quality." />
        <ToolCard to="/admin/audit" icon={BookOpen} title="Audit Logs" body="View complete system audit trail." />
        <ToolCard to="/settings" icon={UserCog} title="AI Configuration" body="Adjust matching engine weights and scoring." />
      </div>
    </AppShell>
  );
}

function ToolCard({ to, icon: Icon, title, body }: { to: string; icon: typeof Database; title: string; body: string }) {
  return (
    <Link to={to}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <Icon className="mb-1 h-5 w-5 text-primary" />
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{body}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="sm" variant="outline" className="pointer-events-none">Open</Button>
        </CardContent>
      </Card>
    </Link>
  );
}

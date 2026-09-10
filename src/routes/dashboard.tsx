import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, FileStack, Layers, PlusCircle, ShieldCheck, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/manakx/AppShell";
import { KpiCard, StatusBadge } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BASELINE, useStore } from "@/lib/manakx/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MANAKX Procurement Standards Intelligence" },
      { name: "description", content: "Procurement analysis KPIs, recent tenders and standards recommendation trends." },
      { property: "og:title", content: "MANAKX Dashboard" },
      { property: "og:description", content: "Live view of analyses, recommendations, gaps and review outcomes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Dashboard() {
  const { analyses, reviews } = useStore();
  const navigate = useNavigate();

  const recommended = analyses.reduce((a, x) => a + x.recommendations.length, 0);
  const gaps = analyses.reduce((a, x) => a + x.gaps.length, 0);
  const decided = reviews.filter((r) => r.decision !== "Pending");
  const accepted = decided.filter((r) => r.decision === "Approved").length;
  const acceptance = Math.round(
    ((accepted + BASELINE.acceptedReviews) / Math.max(1, decided.length + BASELINE.reviews)) * 100,
  );

  const byCategory = Object.entries(
    analyses.reduce<Record<string, number>>((acc, a) => {
      acc[a.category] = (acc[a.category] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name: name.split(" ")[0], value }));

  const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const trend = months.map((m, i) => {
    const monthAnalyses = analyses.filter((a) => new Date(a.createdAt).getMonth() === i + 2);
    return {
      month: m,
      standards: monthAnalyses.reduce((s, a) => s + a.recommendations.length, 0) + 24 + i * 9,
      gaps: monthAnalyses.reduce((s, a) => s + a.gaps.length, 0) + 12 + ((i * 5) % 11),
    };
  });

  const outcomes = ["Approved", "Rejected", "Review Requested", "Pending"].map((d) => ({
    name: d,
    value: reviews.filter((r) => r.decision === d).length,
  })).filter((d) => d.value > 0);

  return (
    <AppShell
      title="Procurement Standards Dashboard"
      description="Synthetic operating picture across analyses, recommendations and review outcomes."
      crumbs={[{ label: "Dashboard" }]}
      actions={
        <Button asChild>
          <Link to="/analysis/new">
            <PlusCircle className="mr-1.5 h-4 w-4" /> New Analysis
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total Analyses" value={BASELINE.analyses + analyses.length} sub="Since deployment" icon={FileStack} to="/history" />
        <KpiCard label="Standards Recommended" value={BASELINE.standardsRecommended + recommended} sub="Across all analyses" icon={Layers} to="/standards" />
        <KpiCard label="Potential Gaps Detected" value={BASELINE.gaps + gaps} sub="Review recommended" icon={TrendingUp} />
        <KpiCard label="Human Reviews" value={BASELINE.reviews + decided.length} sub="Decisions recorded" icon={ShieldCheck} to="/review" />
        <KpiCard label="Acceptance Rate" value={`${acceptance}%`} sub="Recommendations approved" icon={CheckCircle2} to="/admin/analytics" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Analyses by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis fontSize={11} stroke="var(--muted-foreground)" allowDecimals={false} />
                <RTooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" name="Analyses" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Standards Recommendation Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis fontSize={11} stroke="var(--muted-foreground)" />
                <RTooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="standards" name="Standards recommended" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Requirement Gap Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis fontSize={11} stroke="var(--muted-foreground)" />
                <RTooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="gaps" name="Potential gaps" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Review Outcome Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={outcomes} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {outcomes.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <RTooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Recent Analyses</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/history">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Analysis ID</TableHead>
                  <TableHead>Tender / Project</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Requirements</TableHead>
                  <TableHead className="text-right">Standards</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.slice(0, 8).map((a) => (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer"
                    onClick={() => navigate({ to: "/analysis/$id", params: { id: a.id } })}
                  >
                    <TableCell className="font-mono text-xs">{a.id}</TableCell>
                    <TableCell className="max-w-[280px] truncate font-medium">{a.tenderTitle}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.category}</TableCell>
                    <TableCell className="text-right">{a.requirements.length}</TableCell>
                    <TableCell className="text-right">{a.recommendations.length}</TableCell>
                    <TableCell>
                      <StatusBadge status={a.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

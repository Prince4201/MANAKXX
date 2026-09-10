import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, MessageSquare, TrendingUp, Triangle } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/manakx/AppShell";
import { KpiCard, SectionTitle } from "@/components/manakx/bits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORIES } from "@/lib/manakx/standards";
import { useStore } from "@/lib/manakx/store";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Engine Analytics — MANAKX Admin" },
      { name: "description", content: "Acceptance rate, category demand, gap frequency and reviewer feedback quality for the MANAKX prototype." },
      { property: "og:title", content: "Engine Analytics — MANAKX Admin" },
      { property: "og:description", content: "How the deterministic matching engine is performing across synthetic analyses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminAnalytics,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function AdminAnalytics() {
  const { analyses, reviews, feedback } = useStore();

  const decided = reviews.filter((r) => r.decision !== "Pending");
  const approved = reviews.filter((r) => r.decision === "Approved").length;
  const acceptance = decided.length ? Math.round((approved / decided.length) * 100) : 0;

  const byCategory = CATEGORIES.map((c) => ({
    name: c.split(" ")[0] ?? c,
    analyses: analyses.filter((a) => a.category === c).length,
    standards: analyses.filter((a) => a.category === c).reduce((n, a) => n + a.recommendations.length, 0),
  })).filter((d) => d.analyses > 0);

  const gapData = Object.entries(
    analyses
      .flatMap((a) => a.gaps)
      .reduce<Record<string, number>>((acc, g) => {
        acc[g.area] = (acc[g.area] ?? 0) + 1;
        return acc;
      }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const feedbackData = Object.entries(
    feedback.reduce<Record<string, number>>((acc, f) => {
      acc[f.kind] = (acc[f.kind] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const avgRelevance = (() => {
    const all = analyses.flatMap((a) => a.recommendations.map((r) => r.relevance));
    return all.length ? Math.round(all.reduce((x, y) => x + y, 0) / all.length) : 0;
  })();

  return (
    <AppShell
      title="Engine Analytics"
      description="Live figures computed from stored synthetic analyses, reviews and feedback."
      crumbs={[{ label: "Administration", to: "/admin" }, { label: "Analytics" }]}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Acceptance rate" value={`${acceptance}%`} sub={`${decided.length} decisions recorded`} icon={CheckCircle2} />
        <KpiCard label="Avg. relevance" value={`${avgRelevance}%`} sub="Across all recommendations" icon={TrendingUp} />
        <KpiCard label="Gaps flagged" value={analyses.reduce((n, a) => n + a.gaps.length, 0)} sub="Potentially missing areas" icon={Triangle} />
        <KpiCard label="Feedback entries" value={feedback.length} sub="Reviewer signals" icon={MessageSquare} />
      </div>

      <SectionTitle title="Demand and coverage" description="Which procurement categories are driving analyses and recommendations." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Analyses & standards by category</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="analyses" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="standards" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Most frequent gap areas</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gapData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--chart-4)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <SectionTitle title="Reviewer feedback quality" description="Feedback recorded by reviewers on individual recommendations." />
      <Card>
        <CardContent className="h-80 p-4">
          {feedbackData.length === 0 ? (
            <p className="grid h-full place-items-center text-sm text-muted-foreground">
              No feedback recorded yet — add some from the Human Review queue.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={feedbackData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={110} paddingAngle={2}>
                  {feedbackData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

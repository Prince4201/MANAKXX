import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Database, FileCheck2, Layers, ShieldCheck, Users } from "lucide-react";
import { AppShell } from "@/components/manakx/AppShell";
import { KpiCard, SectionTitle } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORIES } from "@/lib/manakx/standards";
import { useStore } from "@/lib/manakx/store";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — MANAKX" },
      { name: "description", content: "Administer the synthetic standards knowledge base, monitor usage and open engine analytics." },
      { property: "og:title", content: "Admin Dashboard — MANAKX" },
      { property: "og:description", content: "Knowledge base health and prototype usage overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { standards, analyses, reviews, feedback } = useStore();
  const active = standards.filter((s) => s.status === "Active — Demo").length;

  return (
    <AppShell
      title="Admin Dashboard"
      description="Manage the synthetic knowledge base powering the MANAKX recommendation engine."
      crumbs={[{ label: "Administration" }]}
      actions={
        <>
          <Button asChild variant="outline">
            <Link to="/admin/standards">Standards database</Link>
          </Button>
          <Button asChild>
            <Link to="/admin/analytics">Open analytics</Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Standards in base" value={standards.length} sub={`${active} active`} icon={Database} />
        <KpiCard label="Categories covered" value={CATEGORIES.length} sub="Product domains mapped" icon={Layers} />
        <KpiCard label="Analyses run" value={analyses.length} sub="Stored locally" icon={FileCheck2} />
        <KpiCard label="Review decisions" value={reviews.length} sub={`${feedback.length} feedback entries`} icon={ShieldCheck} />
      </div>

      <SectionTitle title="Coverage by category" description="Number of synthetic standards available for matching in each category." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => {
          const count = standards.filter((s) => s.category === c).length;
          return (
            <Card key={c}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{c}</p>
                  <p className="text-xs text-muted-foreground">{count} synthetic standards</p>
                </div>
                <span className="font-display text-xl font-semibold text-primary">{count}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <SectionTitle title="Administration tools" />
      <div className="grid gap-3 md:grid-cols-3">
        <ToolCard
          to="/admin/standards"
          icon={Database}
          title="Standards database"
          body="Add, edit or deactivate synthetic standards. Changes immediately affect new recommendations."
        />
        <ToolCard
          to="/admin/analytics"
          icon={BarChart3}
          title="Engine analytics"
          body="Track category demand, acceptance rate, gap frequency and reviewer feedback quality."
        />
        <ToolCard
          to="/settings"
          icon={Users}
          title="Scoring configuration"
          body="Adjust the weights used by the matching engine and reset the prototype dataset."
        />
      </div>
    </AppShell>
  );
}

function ToolCard({
  to,
  icon: Icon,
  title,
  body,
}: {
  to: "/admin/standards" | "/admin/analytics" | "/settings";
  icon: typeof Database;
  title: string;
  body: string;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <Icon className="mb-1 h-5 w-5 text-primary" />
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild size="sm" variant="outline">
          <Link to={to}>Open</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

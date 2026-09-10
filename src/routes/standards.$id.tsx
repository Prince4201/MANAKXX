import { createFileRoute, Link } from "@tanstack/react-router";
import { GitCompare } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/manakx/AppShell";
import { EmptyState, StatusBadge, SyntheticBadge } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { actions, useStore } from "@/lib/manakx/store";

export const Route = createFileRoute("/standards/$id")({
  head: () => ({
    meta: [
      { title: "Standard Details — MANAKX" },
      { name: "description", content: "Scope, requirement areas, applicable products and recommendation history for a synthetic demo standard." },
      { property: "og:title", content: "Standard Details — MANAKX" },
      { property: "og:description", content: "Synthetic prototype standard record used by the MANAKX matching engine." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StandardDetails,
});

function StandardDetails() {
  const { id } = Route.useParams();
  const { standards, analyses, compare } = useStore();
  const std = standards.find((s) => s.id === id);

  if (!std) {
    return (
      <AppShell title="Standard not found" crumbs={[{ label: "Standards", to: "/standards" }, { label: id }]}>
        <EmptyState
          title="No such standard in the prototype knowledge base"
          description="It may have been removed in the admin area."
          action={
            <Button asChild>
              <Link to="/standards">Back to search</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const history = analyses
    .map((a) => ({ a, rec: a.recommendations.find((r) => r.standardId === std.id) }))
    .filter((x) => x.rec);

  const inCompare = compare.includes(std.id);

  return (
    <AppShell
      title={std.title}
      description={`${std.id} · ${std.category} · ${std.productDomain}`}
      crumbs={[{ label: "Standards", to: "/standards" }, { label: std.id }]}
      actions={
        <>
          <Button
            variant={inCompare ? "secondary" : "outline"}
            onClick={() => {
              actions.toggleCompare(std.id);
              toast.message(inCompare ? "Removed from comparison" : "Added to comparison");
            }}
          >
            <GitCompare className="mr-1.5 h-4 w-4" /> {inCompare ? "In comparison" : "Add to comparison"}
          </Button>
          <Button asChild variant="outline">
            <Link to="/compare">Open comparison</Link>
          </Button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={std.status} />
        <SyntheticBadge />
        <span className="text-xs text-muted-foreground">
          Version {std.version} · Updated {std.lastUpdated} · Source: {std.sourceType}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Overview & scope</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{std.scope}</p>
              <p className="text-muted-foreground">
                This is a synthetic prototype standard. It does not reproduce clauses of any official document and must
                not be used as compliance evidence.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Recommendation history</CardTitle></CardHeader>
            <CardContent className="px-0">
              {history.length === 0 ? (
                <p className="px-6 pb-4 text-sm text-muted-foreground">
                  This standard has not yet been recommended in a stored analysis.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Analysis</TableHead>
                      <TableHead>Tender</TableHead>
                      <TableHead className="text-right">Relevance</TableHead>
                      <TableHead className="text-right">Coverage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map(({ a, rec }) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-xs">
                          <Link to="/analysis/$id" params={{ id: a.id }} search={{}} className="hover:underline">
                            {a.id}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-[320px] truncate">{a.tenderTitle}</TableCell>
                        <TableCell className="text-right">{rec!.relevance}%</TableCell>
                        <TableCell className="text-right">{rec!.coverage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {history[0]?.rec ? (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Why it was recommended</CardTitle></CardHeader>
              <CardContent className="text-sm">{history[0].rec.why}</CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Record</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Field label="Category" value={std.category} />
              <Field label="Product domain" value={std.productDomain} />
              <Field label="Applicable products" value={std.applicableProducts.join(", ")} />
              <Field label="Requirement areas" value={std.requirementAreas.join(", ")} />
              <Field label="Keywords" value={std.keywords.join(", ")} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Related standards</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {std.relatedStandards.map((rid) => {
                const r = standards.find((x) => x.id === rid);
                if (!r) return null;
                return (
                  <Link
                    key={rid}
                    to="/standards/$id"
                    params={{ id: rid }}
                    className="block rounded-md border p-2 text-sm hover:bg-muted/60"
                  >
                    <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                    <p className="truncate">{r.title}</p>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5">{value}</p>
    </div>
  );
}

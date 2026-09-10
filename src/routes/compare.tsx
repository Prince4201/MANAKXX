import { createFileRoute, Link } from "@tanstack/react-router";
import { GitCompare, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/manakx/AppShell";
import { EmptyState, StatusBadge } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { uid } from "@/lib/manakx/engine";
import { actions, useStore } from "@/lib/manakx/store";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Standards — MANAKX" },
      { name: "description", content: "Side-by-side comparison of up to four recommended synthetic standards on relevance, coverage and match quality." },
      { property: "og:title", content: "Compare Standards — MANAKX" },
      { property: "og:description", content: "Compare recommended standards before sending them to human review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { compare, standards, analyses, user } = useStore();
  const [latest] = analyses;
  const selected = compare.map((id) => standards.find((s) => s.id === id)).filter(Boolean);

  const recFor = (stdId: string) =>
    analyses.flatMap((a) => a.recommendations.filter((r) => r.standardId === stdId).map((r) => ({ a, r })))[0];

  return (
    <AppShell
      title="Compare Standards"
      description="Select two to four standards from any recommendation list to compare them side by side."
      crumbs={[{ label: "Compare Standards" }]}
      actions={
        compare.length ? (
          <Button variant="outline" onClick={() => actions.setCompare([])}>
            Clear comparison
          </Button>
        ) : undefined
      }
    >
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <span className="text-sm text-muted-foreground">Add a standard</span>
          <Select
            value=""
            onValueChange={(v) => {
              actions.toggleCompare(v);
              toast.message("Comparison updated");
            }}
          >
            <SelectTrigger className="w-96">
              <SelectValue placeholder="Choose a standard from the knowledge base" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {standards.slice(0, 60).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.id} — {s.title.replace(" — Synthetic Demo Standard", "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{compare.length}/4 selected</span>
        </CardContent>
      </Card>

      {selected.length < 2 ? (
        <EmptyState
          icon={GitCompare}
          title="Select at least two standards"
          description="Use the Compare button on any recommendation card, or pick standards from the dropdown above."
          action={
            <Button asChild variant="outline">
              <Link to="/standards">Browse standards</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto px-0 py-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Attribute</TableHead>
                  {selected.map((s) => (
                    <TableHead key={s!.id} className="min-w-56">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">{s!.id}</p>
                          <p className="whitespace-normal text-sm font-medium">{s!.title}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => actions.toggleCompare(s!.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ["Relevance", (id: string) => `${recFor(id)?.r.relevance ?? "—"}%`],
                  ["Confidence", (id: string) => `${recFor(id)?.r.confidence ?? "—"}%`],
                  ["Requirement coverage", (id: string) => `${recFor(id)?.r.coverage ?? "—"}%`],
                  [
                    "Product match",
                    (id: string) => {
                      const b = recFor(id)?.r.breakdown;
                      return b ? `${b.productDomain.toFixed(1)} / 30` : "—";
                    },
                  ],
                  [
                    "Requirement match",
                    (id: string) => {
                      const b = recFor(id)?.r.breakdown;
                      return b ? `${b.requirementSimilarity.toFixed(1)} / 35` : "—";
                    },
                  ],
                  [
                    "Scope match",
                    (id: string) => {
                      const b = recFor(id)?.r.breakdown;
                      return b ? `${b.scope.toFixed(1)} / 20` : "—";
                    },
                  ],
                  [
                    "Unmatched requirements",
                    (id: string) => {
                      const r = recFor(id)?.r;
                      return r ? String(r.matches.filter((m) => m.strength === "No Match").length) : "—";
                    },
                  ],
                ].map(([label, fn]) => (
                  <TableRow key={label as string}>
                    <TableCell className="font-medium">{label as string}</TableCell>
                    {selected.map((s) => (
                      <TableCell key={s!.id}>{(fn as (id: string) => string)(s!.id)}</TableCell>
                    ))}
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-medium">Status</TableCell>
                  {selected.map((s) => (
                    <TableCell key={s!.id}>
                      <StatusBadge status={s!.status} />
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Action</TableCell>
                  {selected.map((s) => (
                    <TableCell key={s!.id}>
                      <div className="flex flex-col gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/standards/$id" params={{ id: s!.id }}>
                            Details
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            const target = recFor(s!.id)?.a ?? latest;
                            if (!target) {
                              toast.error("Run an analysis first");
                              return;
                            }
                            actions.upsertReview({
                              id: uid("rev"),
                              analysisId: target.id,
                              standardId: s!.id,
                              aiScore: recFor(s!.id)?.r.relevance ?? 0,
                              reviewer: user?.name ?? "Demo Officer",
                              decision: "Pending",
                              comment: "",
                              updatedAt: new Date().toISOString(),
                            });
                            toast.success("Added to review", { description: `${s!.id} queued against ${target.id}.` });
                          }}
                        >
                          Add to Review
                        </Button>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}

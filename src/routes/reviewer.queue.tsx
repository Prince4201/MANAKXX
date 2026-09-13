import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/manakx/AppShell";
import { StatusBadge } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/manakx/store";

export const Route = createFileRoute("/reviewer/queue")({
  head: () => ({ meta: [{ title: "Review Queue — MANAKX" }] }),
  component: ReviewerQueue,
});

function ReviewerQueue() {
  const { analyses } = useStore();
  const pending = analyses.filter((a) => a.status === "Needs Review" || a.status === "Completed");

  return (
    <AppShell
      title="Review Queue"
      description="All procurements requiring technical review."
      crumbs={[{ label: "Reviewer", path: "/reviewer" }, { label: "Queue" }]}
    >
      {pending.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No procurements are currently pending review.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pending.map((a) => (
            <Card key={a.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{a.id}</span>
                  <StatusBadge status={a.status} />
                </div>
                <CardTitle className="text-base">{a.tenderTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="mb-4 grid grid-cols-2 gap-1 text-sm">
                  <dt className="text-muted-foreground">Officer</dt>
                  <dd className="font-medium">{a.createdBy}</dd>
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-medium">{a.category}</dd>
                  <dt className="text-muted-foreground">Requirements</dt>
                  <dd className="font-medium">{a.requirements.length}</dd>
                  <dt className="text-muted-foreground">Standards</dt>
                  <dd className="font-medium">{a.recommendations.length}</dd>
                  <dt className="text-muted-foreground">Gaps</dt>
                  <dd className="font-medium">{a.gaps.length}</dd>
                  <dt className="text-muted-foreground">Conflicts</dt>
                  <dd className="font-medium">{a.conflicts.length}</dd>
                </dl>
                <Button asChild className="w-full">
                  <Link to="/analysis/$id" params={{ id: a.id }}>
                    <ShieldCheck className="mr-2 h-4 w-4" /> Start Review
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

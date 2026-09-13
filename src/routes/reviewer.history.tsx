import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/manakx/AppShell";
import { StatusBadge } from "@/components/manakx/bits";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/lib/manakx/store";

export const Route = createFileRoute("/reviewer/history")({
  head: () => ({ meta: [{ title: "Review History — MANAKX" }] }),
  component: ReviewerHistory,
});

function ReviewerHistory() {
  const { reviews, standards } = useStore();
  const completed = reviews.filter((r) => r.decision !== "Pending");

  return (
    <AppShell
      title="Review History"
      description="Your past review decisions and comments."
      crumbs={[{ label: "Reviewer", path: "/reviewer" }, { label: "History" }]}
    >
      {completed.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No review history yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Analysis</TableHead>
                <TableHead>Standard</TableHead>
                <TableHead>AI Score</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completed.map((r) => {
                const std = standards.find((s) => s.id === r.standardId);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.analysisId}</TableCell>
                    <TableCell className="text-sm font-medium">{std?.title?.slice(0, 40) ?? r.standardId}</TableCell>
                    <TableCell className="text-sm">{r.aiScore}%</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.decision === "Approved" ? "bg-green-100 text-green-700" :
                        r.decision === "Rejected" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>{r.decision}</span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{r.comment}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(r.updatedAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </AppShell>
  );
}

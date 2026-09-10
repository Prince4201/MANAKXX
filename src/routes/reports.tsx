import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { AppShell } from "@/components/manakx/AppShell";
import { EmptyState, StatusBadge } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/lib/manakx/store";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — MANAKX" },
      { name: "description", content: "Generate print-ready procurement standards analysis reports for any stored analysis." },
      { property: "og:title", content: "Reports — MANAKX" },
      { property: "og:description", content: "Professional procurement analysis reports with requirements, standards, gaps and review outcomes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { analyses, reviews } = useStore();

  return (
    <AppShell
      title="Reports"
      description="Every analysis can be turned into a professional, print-ready report."
      crumbs={[{ label: "Reports" }]}
    >
      {analyses.length === 0 ? (
        <EmptyState icon={FileText} title="No analyses yet" description="Run an analysis to generate its report." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto px-0 py-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Analysis</TableHead>
                  <TableHead>Tender</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Standards</TableHead>
                  <TableHead className="text-right">Reviews</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Report</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.id}</TableCell>
                    <TableCell className="max-w-[300px] truncate font-medium">{a.tenderTitle}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.category}</TableCell>
                    <TableCell className="text-right">{a.recommendations.length}</TableCell>
                    <TableCell className="text-right">
                      {reviews.filter((r) => r.analysisId === a.id).length}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={a.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/analysis/$id/report" params={{ id: a.id }}>
                          Generate report
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/manakx/AppShell";
import { EmptyState, StatusBadge } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/lib/manakx/store";

export const Route = createFileRoute("/analysis/$id/report")({
  head: () => ({
    meta: [
      { title: "Procurement Standards Analysis Report — MANAKX" },
      { name: "description", content: "Print-ready procurement standards analysis report with requirements, recommendations, gaps, conflicts and review outcomes." },
      { property: "og:title", content: "Procurement Standards Analysis Report — MANAKX" },
      { property: "og:description", content: "Full analysis report for a tender specification." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { id } = Route.useParams();
  const { analyses, standards, reviews } = useStore();
  const analysis = analyses.find((a) => a.id === id);
  const stdMap = new Map(standards.map((s) => [s.id, s]));

  if (!analysis) {
    return (
      <AppShell title="Report unavailable" crumbs={[{ label: "Report" }]}>
        <EmptyState title="Analysis not found" description="Open an analysis from the history page to generate its report." />
      </AppShell>
    );
  }

  const analysisReviews = reviews.filter((r) => r.analysisId === analysis.id);

  const download = () => {
    const lines = [
      `MANAKX — Procurement Standards Analysis`,
      `Analysis: ${analysis.id}  |  Tender: ${analysis.tenderTitle}  |  Reference: ${analysis.reference}`,
      `Category: ${analysis.category}  |  Product: ${analysis.product}  |  Date: ${new Date(analysis.createdAt).toLocaleString("en-IN")}`,
      ``,
      `EXTRACTED REQUIREMENTS`,
      ...analysis.requirements.map((r) => ` - [${r.type}/${r.importance}/${r.confidence}%] ${r.text}`),
      ``,
      `RECOMMENDED STANDARDS`,
      ...analysis.recommendations.map(
        (r) => ` - ${r.standardId} (${r.relevance}% relevance, ${r.confidence}% confidence, ${r.coverage}% coverage) ${stdMap.get(r.standardId)?.title ?? ""}`,
      ),
      ``,
      `POTENTIAL GAPS`,
      ...analysis.gaps.map((g) => ` - [${g.severity}] ${g.area} — ${g.recommendedReview}`),
      ``,
      `POTENTIAL CONFLICTS`,
      ...(analysis.conflicts.length ? analysis.conflicts.map((c) => ` - [${c.severity}] ${c.title} — ${c.detail}`) : [" - None detected"]),
      ``,
      `HUMAN REVIEW`,
      ...(analysisReviews.length
        ? analysisReviews.map((r) => ` - ${r.standardId}: ${r.decision} by ${r.reviewer} — ${r.comment}`)
        : [" - No review decisions recorded"]),
      ``,
      `DISCLAIMER: Prototype / Synthetic Data — Not an Official BIS Database. MANAKX provides decision support, not legal or regulatory certification.`,
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${analysis.id}-manakx-report.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  return (
    <AppShell
      title="Procurement Standards Analysis Report"
      description={`${analysis.id} · generated ${new Date().toLocaleString("en-IN")}`}
      crumbs={[
        { label: "History", to: "/history" },
        { label: analysis.id, to: "/analysis/$id" },
        { label: "Report" },
      ]}
      actions={
        <>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> Print / Save as PDF
          </Button>
          <Button onClick={download}>
            <Download className="mr-1.5 h-4 w-4" /> Download
          </Button>
          <Button asChild variant="ghost">
            <Link to="/analysis/$id" params={{ id: analysis.id }}>
              Back to analysis
            </Link>
          </Button>
        </>
      }
    >
      <Card>
        <CardContent className="space-y-8 p-8">
          <header className="border-b pb-4">
            <p className="font-display text-2xl font-semibold">MANAKX</p>
            <p className="text-sm text-muted-foreground">Procurement Standards Analysis</p>
          </header>

          <section>
            <h2 className="font-display text-base font-semibold">1. Tender information</h2>
            <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
              {[
                ["Analysis ID", analysis.id],
                ["Tender / project", analysis.tenderTitle],
                ["Reference", analysis.reference],
                ["Category", analysis.category],
                ["Product", analysis.product],
                ["Input method", `${analysis.inputMethod} — ${analysis.sourceName}`],
                ["Prepared by", analysis.createdBy],
                ["Date", new Date(analysis.createdAt).toLocaleString("en-IN")],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="w-36 shrink-0 text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">2. Extracted requirements</h2>
            <Table className="mt-2">
              <TableHeader>
                <TableRow>
                  <TableHead>Requirement</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Importance</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.requirements.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.text}</TableCell>
                    <TableCell>{r.type}</TableCell>
                    <TableCell>{r.importance}</TableCell>
                    <TableCell className="text-right">{r.confidence}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">3. Recommended standards</h2>
            <Table className="mt-2">
              <TableHeader>
                <TableRow>
                  <TableHead>Standard</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">Relevance</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                  <TableHead className="text-right">Coverage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.recommendations.slice(0, 10).map((r) => (
                  <TableRow key={r.standardId}>
                    <TableCell className="font-mono text-xs">{r.standardId}</TableCell>
                    <TableCell>{stdMap.get(r.standardId)?.title}</TableCell>
                    <TableCell className="text-right">{r.relevance}%</TableCell>
                    <TableCell className="text-right">{r.confidence}%</TableCell>
                    <TableCell className="text-right">{r.coverage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">4. Requirement-to-standard mapping</h2>
            <Table className="mt-2">
              <TableHeader>
                <TableRow>
                  <TableHead>Requirement</TableHead>
                  {analysis.recommendations.slice(0, 4).map((r) => (
                    <TableHead key={r.standardId} className="font-mono text-xs">
                      {r.standardId}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.requirements.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{req.text}</TableCell>
                    {analysis.recommendations.slice(0, 4).map((rec) => (
                      <TableCell key={rec.standardId}>
                        {rec.matches.find((m) => m.requirementId === req.id)?.strength ?? "No Match"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">5. Potential gaps</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {analysis.gaps.length === 0 ? (
                <li className="text-muted-foreground">No requirement areas were flagged as potentially missing.</li>
              ) : (
                analysis.gaps.map((g) => (
                  <li key={g.id}>
                    <span className="font-medium">[{g.severity}] {g.area}</span> — {g.reason}{" "}
                    <em className="text-muted-foreground">{g.recommendedReview}</em>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">6. Potential conflicts</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {analysis.conflicts.length === 0 ? (
                <li className="text-muted-foreground">No contradictory requirements were detected.</li>
              ) : (
                analysis.conflicts.map((c) => (
                  <li key={c.id}>
                    <span className="font-medium">[{c.severity}] {c.title}</span> — {c.detail}{" "}
                    <em className="text-muted-foreground">{c.recommendation}</em>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">7. Human review</h2>
            {analysisReviews.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No review decisions have been recorded yet.</p>
            ) : (
              <Table className="mt-2">
                <TableHeader>
                  <TableRow>
                    <TableHead>Standard</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Decision</TableHead>
                    <TableHead>Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysisReviews.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.standardId}</TableCell>
                      <TableCell>{r.reviewer}</TableCell>
                      <TableCell>
                        <StatusBadge status={r.decision} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.comment || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">8. Recommendation summary</h2>
            <p className="mt-2 text-sm">
              {analysis.requirements.length} technical requirements were extracted from the specification.{" "}
              {analysis.recommendations.length} synthetic standards were retrieved as candidates, of which{" "}
              {analysis.recommendations.filter((r) => r.band === "Highly Relevant").length} scored as highly relevant.{" "}
              {analysis.gaps.length} requirement area(s) are flagged for review and {analysis.conflicts.length}{" "}
              potential conflict(s) were detected.
            </p>
          </section>

          <section className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
            <h2 className="font-display text-base font-semibold">9. Disclaimer</h2>
            <p className="mt-1">
              Prototype / Synthetic Data — Not an Official BIS Database. MANAKX provides decision support, not legal or
              regulatory certification. The standards referenced here are synthetic records created for demonstration
              and must not be cited as compliance evidence.
            </p>
          </section>
        </CardContent>
      </Card>
    </AppShell>
  );
}

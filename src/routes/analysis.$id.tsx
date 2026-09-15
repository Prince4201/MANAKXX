import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  FileText,
  GitCompare,
  Info,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/manakx/AppShell";
import { EmptyState, ScoreRing, StatusBadge, SyntheticBadge, TypeBadge } from "@/components/manakx/bits";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uid } from "@/lib/manakx/engine";
import { actions, useStore } from "@/lib/manakx/store";
import { REQUIREMENT_TYPES, type Analysis, type Importance, type Requirement, type RequirementType } from "@/lib/manakx/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analysis/$id")({
  validateSearch: (search: Record<string, unknown>): { run?: string } =>
    typeof search["run"] === "string" ? { run: search["run"] } : {},
  head: () => ({
    meta: [
      { title: "Analysis Workspace — MANAKX" },
      {
        name: "description",
        content:
          "Extracted requirements, ranked standards recommendations, gaps and conflicts for a procurement specification.",
      },
      { property: "og:title", content: "Analysis Workspace — MANAKX" },
      { property: "og:description", content: "Explainable standards recommendations for a tender specification." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalysisPage,
});

const PIPELINE = [
  "Document received",
  "Text extracted",
  "Technical requirements identified",
  "Requirements classified",
  "Candidate standards retrieved",
  "Standards ranked",
  "Requirement coverage calculated",
  "Potential gaps checked",
  "Conflicts checked",
  "Explanation generated",
];

function AnalysisPage() {
  const { id } = Route.useParams();
  const { run } = Route.useSearch();
  const navigate = useNavigate();
  const { analyses } = useStore();
  const analysis = analyses.find((a) => a.id === id);
  const [step, setStep] = useState(run === "1" ? 0 : PIPELINE.length);

  useEffect(() => {
    if (run !== "1") {
      setStep(PIPELINE.length);
      return;
    }
    setStep(0);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setStep(i);
      if (i >= PIPELINE.length) {
        clearInterval(t);
        actions.updateAnalysis(id, { status: "DRAFT" });
        toast.success("Analysis complete", { description: "Ranked standards recommendations are ready." });
        navigate({ to: "/analysis/$id", params: { id }, search: {}, replace: true });
      }
    }, 650);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, id]);

  if (!analysis) {
    return (
      <AppShell title="Analysis not found" crumbs={[{ label: "Analysis" }]}>
        <EmptyState
          icon={Info}
          title="This analysis is not in the prototype store"
          description="It may have been created in another browser session. Start a new analysis to continue."
          action={
            <Button asChild>
              <Link to="/analysis/new">New Analysis</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  if (step < PIPELINE.length) {
    return (
      <AppShell
        title="Running analysis pipeline"
        description={`${analysis.tenderTitle} · ${analysis.category}`}
        crumbs={[{ label: "History", to: "/history" }, { label: analysis.id }]}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">MANAKX pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={(step / PIPELINE.length) * 100} />
              <ul className="space-y-2">
                {PIPELINE.map((label, i) => (
                  <li key={label} className="flex items-center gap-2 text-sm">
                    {i < step ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : i === step ? (
                      <CircleDashed className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <CircleDashed className="h-4 w-4 text-muted-foreground/40" />
                    )}
                    <span className={i <= step ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                Processing {analysis.sourceName} · {analysis.specText.split(/\s+/).length} words
              </p>
            </CardContent>
          </Card>
          <div className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        </div>
      </AppShell>
    );
  }

  return <ResultsView analysis={analysis} />;
}

function ResultsView({ analysis }: { analysis: Analysis }) {
  const { standards, reviews, compare, user } = useStore();
  const stdMap = useMemo(() => new Map(standards.map((s) => [s.id, s])), [standards]);
  const [sort, setSort] = useState("relevance");
  const [band, setBand] = useState("All");
  const [focusReq, setFocusReq] = useState<string | null>(null);
  const [editing, setEditing] = useState<Requirement | null>(null);
  const [deleting, setDeleting] = useState<Requirement | null>(null);
  const [adding, setAdding] = useState(false);

  const recs = analysis.recommendations
    .filter((r) => band === "All" || r.band === band)
    .slice()
    .sort((a, b) =>
      sort === "confidence"
        ? b.confidence - a.confidence
        : sort === "coverage"
          ? b.coverage - a.coverage
          : sort === "category"
            ? (stdMap.get(a.standardId)?.category ?? "").localeCompare(stdMap.get(b.standardId)?.category ?? "")
            : b.relevance - a.relevance,
    );

  const highly = analysis.recommendations.filter((r) => r.band === "Highly Relevant").length;
  const topFive = analysis.recommendations.slice(0, 5);

  const addToReview = (standardId: string, aiScore: number) => {
    actions.upsertReview({
      id: uid("rev"),
      analysisId: analysis.id,
      standardId,
      aiScore,
      reviewer: user?.name ?? "Demo Officer",
      decision: "Pending",
      comment: "",
      updatedAt: new Date().toISOString(),
    });
    toast.success("Added to human review queue", { description: `${standardId} is awaiting a reviewer decision.` });
  };

  const saveRequirement = (req: Requirement) => {
    const exists = analysis.requirements.some((r) => r.id === req.id);
    const requirements = exists
      ? analysis.requirements.map((r) => (r.id === req.id ? req : r))
      : [...analysis.requirements, req];
    actions.updateAnalysis(analysis.id, { requirements });
    actions.recompute(analysis.id);
    toast.success(exists ? "Requirement updated" : "Requirement added", {
      description: "Recommendations, gaps and conflicts were recalculated.",
    });
  };

  return (
    <AppShell
      title={analysis.tenderTitle}
      description={`${analysis.id} · ${analysis.reference} · ${analysis.category} · ${analysis.product}`}
      crumbs={[{ label: "History", to: "/history" }, { label: analysis.id }]}
      actions={
        <>
          <Button asChild variant="outline">
            <Link to="/compare">
              <GitCompare className="mr-1.5 h-4 w-4" /> Compare ({compare.length})
            </Link>
          </Button>
          {(user?.role === "Government Procurement Officer" || user?.role === "Admin") && (
            <>
              {analysis.status === "DRAFT" || analysis.status === "CHANGES_REQUESTED" ? (
                <Button onClick={() => {
                  actions.updateAnalysis(analysis.id, { status: "UNDER_REVIEW" });
                  toast.success("Sent for Review", { description: "Procurement forwarded to Technical Reviewers." });
                }}>
                  <ShieldCheck className="mr-1.5 h-4 w-4" /> Send for Technical Review
                </Button>
              ) : analysis.status === "APPROVED" ? (
                <Button onClick={() => {
                  actions.updateAnalysis(analysis.id, { status: "PUBLISHED" });
                  toast.success("Tender Published", { description: "Vendors can now apply to this tender." });
                }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <FileText className="mr-1.5 h-4 w-4" /> Publish Tender
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link to="/review">
                    <ShieldCheck className="mr-1.5 h-4 w-4" /> View Review Status
                  </Link>
                </Button>
              )}
              <Button asChild>
                <Link to="/analysis/$id/report" params={{ id: analysis.id }}>
                  <FileText className="mr-1.5 h-4 w-4" /> Report
                </Link>
              </Button>
            </>
          )}
          {(user?.role === "Technical Reviewer" || user?.role === "Admin") && analysis.status === "UNDER_REVIEW" && (
            <Button onClick={() => {
              actions.updateAnalysis(analysis.id, { status: "APPROVED" });
              toast.success("Procurement Approved", { description: "All recommendations have been verified." });
            }} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Complete Final Review
            </Button>
          )}
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          ["Requirements detected", analysis.requirements.length],
          ["Candidate standards", analysis.recommendations.length],
          ["Highly relevant", highly],
          ["Potential gaps", analysis.gaps.length],
          ["Potential conflicts", analysis.conflicts.length],
          ["Status", analysis.status],
        ].map(([label, value]) => (
          <Card key={label as string}>
            <CardContent className="p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-1 font-display text-lg font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="recommendations" className="mt-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="requirements">Extracted Requirements</TabsTrigger>
          <TabsTrigger value="mapping">Requirement ↔ Standard Mapping</TabsTrigger>
          <TabsTrigger value="gaps">Gaps & Conflicts</TabsTrigger>
          <TabsTrigger value="source">Specification</TabsTrigger>
        </TabsList>

        {/* ---------------- Recommendations ---------------- */}
        <TabsContent value="recommendations" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Sort by</Label>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-9 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="confidence">Confidence</SelectItem>
                  <SelectItem value="coverage">Coverage</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Filter</Label>
              <Select value={band} onValueChange={setBand}>
                <SelectTrigger className="h-9 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All bands</SelectItem>
                  <SelectItem value="Highly Relevant">Highly relevant</SelectItem>
                  <SelectItem value="Relevant">Relevant</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Showing {recs.length} of {analysis.recommendations.length} candidate standards
            </p>
          </div>

          {recs.length === 0 ? (
            <EmptyState
              icon={Info}
              title="No sufficiently relevant standards found"
              description="No sufficiently relevant standards were found in the prototype knowledge base for this filter. Consider broadening the specification or reviewing the category."
            />
          ) : (
            recs.map((rec) => {
              const std = stdMap.get(rec.standardId);
              if (!std) return null;
              const strong = rec.matches.filter((m) => m.strength === "Strong");
              const partial = rec.matches.filter((m) => m.strength === "Partial");
              const inCompare = compare.includes(std.id);
              return (
                <Card key={rec.standardId} className={cn(focusReq && strong.some((m) => m.requirementId === focusReq) && "ring-2 ring-primary")}>
                  <CardContent className="grid gap-4 p-4 lg:grid-cols-[auto_1fr_auto]">
                    <div className="flex gap-3">
                      <ScoreRing value={rec.relevance} label="Relevance" />
                      <ScoreRing value={rec.confidence} label="Confidence" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{std.id}</span>
                        <StatusBadge status={rec.band} />
                        <SyntheticBadge />
                      </div>
                      <h3 className="mt-1 font-display text-base font-semibold">{std.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{std.scope}</p>

                      <div className="mt-3 rounded-md border bg-muted/40 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Why recommended?
                        </p>
                        <p className="mt-1 text-sm">{rec.why}</p>
                        <ul className="mt-2 space-y-1 text-xs">
                          {strong.slice(0, 4).map((m) => (
                            <li key={m.requirementId} className="flex gap-2 text-success">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              <span className="text-foreground">
                                {m.requirementText} — <span className="text-muted-foreground">{m.evidence}</span>
                              </span>
                            </li>
                          ))}
                          {partial.slice(0, 2).map((m) => (
                            <li key={m.requirementId} className="flex gap-2 text-warning">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                              <span className="text-foreground">
                                Partial: {m.requirementText} — <span className="text-muted-foreground">{m.evidence}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 grid gap-2 text-[11px] text-muted-foreground sm:grid-cols-5">
                          {Object.entries(rec.breakdown).map(([k, v]) => (
                            <div key={k} className="rounded border bg-card p-1.5">
                              <p className="capitalize">{k.replace(/([A-Z])/g, " $1")}</p>
                              <p className="font-mono text-foreground">{v.toFixed(1)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-muted-foreground">
                        Matched {strong.length}/{rec.matches.length} requirements · {partial.length} partial ·
                        coverage {rec.coverage}% · source: {std.sourceType}
                      </p>
                    </div>

                    <div className="flex flex-row gap-2 lg:flex-col">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/standards/$id" params={{ id: std.id }}>
                          View Details
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant={inCompare ? "secondary" : "outline"}
                        onClick={() => {
                          actions.toggleCompare(std.id);
                          toast.message(inCompare ? "Removed from comparison" : "Added to comparison");
                        }}
                      >
                        {inCompare ? "In comparison" : "Compare"}
                      </Button>
                      
                      {(user?.role === "Technical Reviewer" || user?.role === "Admin") ? (
                        <>
                          <Button size="sm" variant="outline" className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400" onClick={() => {
                            addToReview(std.id, rec.relevance);
                            // Auto-approve logic here in a real app
                            toast.success("Approved recommendation");
                          }}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400" onClick={() => {
                            addToReview(std.id, rec.relevance);
                            // Auto-reject logic here in a real app
                            toast.error("Rejected recommendation");
                          }}>
                            Reject
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" onClick={() => addToReview(std.id, rec.relevance)}>
                          Request Review
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ---------------- Requirements ---------------- */}
        <TabsContent value="requirements" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Extracted Requirements</CardTitle>
              {(user?.role === "Government Procurement Officer" || user?.role === "Admin") && (
                <Button size="sm" onClick={() => setAdding(true)}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Requirement
                </Button>
              )}
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requirement</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Importance</TableHead>
                      <TableHead className="text-right">Confidence</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.requirements.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="max-w-[520px]">
                          <p className="font-medium">{r.text}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">Source: “{r.sourceSentence}”</p>
                        </TableCell>
                        <TableCell>
                          <TypeBadge type={r.type} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={r.importance} />
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{r.confidence}%</TableCell>
                        <TableCell className="text-right">
                          {(user?.role === "Government Procurement Officer" || user?.role === "Admin") && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleting(r)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Mapping ---------------- */}
        <TabsContent value="mapping" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Requirement ↔ Standard Mapping</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <p className="px-6 pb-3 text-xs text-muted-foreground">
                Click a requirement to highlight the standards that match it strongly.
              </p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[280px]">Tender requirement</TableHead>
                      {topFive.map((r) => (
                        <TableHead key={r.standardId} className="whitespace-nowrap font-mono text-xs">
                          {r.standardId}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.requirements.map((req) => (
                      <TableRow
                        key={req.id}
                        onClick={() => setFocusReq(focusReq === req.id ? null : req.id)}
                        className={cn("cursor-pointer", focusReq === req.id && "bg-primary/5")}
                      >
                        <TableCell>
                          <p className="text-sm font-medium">{req.text}</p>
                          <TypeBadge type={req.type} />
                        </TableCell>
                        {topFive.map((rec) => {
                          const m = rec.matches.find((x) => x.requirementId === req.id);
                          return (
                            <TableCell key={rec.standardId}>
                              <StatusBadge status={m?.strength ?? "No Match"} />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Gaps & conflicts ---------------- */}
        <TabsContent value="gaps" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Potential Gaps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.gaps.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No obvious requirement areas are missing from this specification.
                </p>
              ) : (
                analysis.gaps.map((g) => (
                  <div key={g.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{g.area}</p>
                      <StatusBadge status={g.severity} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{g.reason}</p>
                    <p className="mt-1 text-xs">
                      <span className="font-medium">Review recommended:</span> {g.recommendedReview}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Specification Conflicts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.conflicts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contradictory requirements were detected.</p>
              ) : (
                analysis.conflicts.map((c) => (
                  <div key={c.id} className="rounded-md border border-warning/40 bg-warning/5 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-1.5 text-sm font-medium">
                        <AlertTriangle className="h-4 w-4 text-warning" /> {c.title}
                      </p>
                      <StatusBadge status={c.severity} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{c.detail}</p>
                    <p className="mt-1 text-xs">
                      <span className="font-medium">Recommendation:</span> {c.recommendation}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="source" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Specification text · {analysis.sourceName}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-4 text-xs leading-relaxed">
                {analysis.specText}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RequirementDialog
        open={adding || editing !== null}
        requirement={editing}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
        onSave={saveRequirement}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this requirement?</AlertDialogTitle>
            <AlertDialogDescription>
              Recommendations, gaps and conflicts will be recalculated without it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleting) return;
                actions.updateAnalysis(analysis.id, {
                  requirements: analysis.requirements.filter((r) => r.id !== deleting.id),
                });
                actions.recompute(analysis.id);
                setDeleting(null);
                toast.success("Requirement deleted", { description: "Results recalculated." });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function RequirementDialog({
  open,
  requirement,
  onClose,
  onSave,
}: {
  open: boolean;
  requirement: Requirement | null;
  onClose: () => void;
  onSave: (r: Requirement) => void;
}) {
  const [text, setText] = useState("");
  const [type, setType] = useState<RequirementType>("Performance");
  const [importance, setImportance] = useState<Importance>("High");

  useEffect(() => {
    if (open) {
      setText(requirement?.text ?? "");
      setType(requirement?.type ?? "Performance");
      setImportance(requirement?.importance ?? "High");
    }
  }, [open, requirement]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{requirement ? "Edit requirement" : "Add requirement"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="rtext">Requirement text</Label>
            <Input id="rtext" className="mt-1" value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as RequirementType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REQUIREMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Importance</Label>
              <Select value={importance} onValueChange={(v) => setImportance(v as Importance)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["High", "Medium", "Low"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (text.trim().length < 4) {
                toast.error("Requirement text is too short");
                return;
              }
              onSave({
                id: requirement?.id ?? uid("req"),
                text: text.trim(),
                type,
                importance,
                confidence: requirement?.confidence ?? 90,
                sourceSentence: requirement?.sourceSentence ?? "Added manually by the procurement officer.",
              });
              onClose();
            }}
          >
            Save requirement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

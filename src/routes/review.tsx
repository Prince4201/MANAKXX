import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquarePlus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/manakx/AppShell";
import { EmptyState, StatusBadge } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { uid } from "@/lib/manakx/engine";
import { actions, useStore } from "@/lib/manakx/store";
import type { FeedbackKind, Review } from "@/lib/manakx/types";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Human Review — MANAKX" },
      { name: "description", content: "Human-in-the-loop review queue: accept, reject or escalate AI standards recommendations and record feedback." },
      { property: "og:title", content: "Human Review Queue — MANAKX" },
      { property: "og:description", content: "Reviewer decisions feed the MANAKX analytics and acceptance rate." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReviewPage,
});

const FEEDBACK_KINDS: FeedbackKind[] = [
  "Correct recommendation",
  "Partially correct",
  "Incorrect recommendation",
  "Missing standard",
  "Wrong requirement extraction",
];

function ReviewPage() {
  const { reviews, standards, analyses, user } = useStore();
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState<Review | null>(null);
  const [comment, setComment] = useState("");
  const [feedbackFor, setFeedbackFor] = useState<Review | null>(null);
  const [kind, setKind] = useState<FeedbackKind>("Correct recommendation");
  const [fbComment, setFbComment] = useState("");

  const rows = reviews.filter((r) => filter === "All" || r.decision === filter);

  const decide = (r: Review, decision: Review["decision"], note?: string) => {
    actions.upsertReview({
      ...r,
      decision,
      comment: note ?? r.comment,
      reviewer: user?.name ?? r.reviewer,
      updatedAt: new Date().toISOString(),
    });
    toast.success(`Recommendation ${decision.toLowerCase()}`, {
      description: `${r.standardId} on ${r.analysisId} — dashboard statistics updated.`,
    });
  };

  return (
    <AppShell
      title="Human Review"
      description="Every AI recommendation sent for review, with the decision and comment recorded against the analysis."
      crumbs={[{ label: "Human Review" }]}
      actions={
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["All", "Pending", "Approved", "Rejected", "Review Requested"].map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="The review queue is empty"
          description="Open an analysis and use “Add to Review” on a recommendation to send it here."
          action={
            <Button asChild>
              <Link to="/history">Open an analysis</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto px-0 py-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Analysis</TableHead>
                  <TableHead>Recommended standard</TableHead>
                  <TableHead className="text-right">AI score</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead className="text-right">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const std = standards.find((s) => s.id === r.standardId);
                  const analysis = analyses.find((a) => a.id === r.analysisId);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">
                        <Link to="/analysis/$id" params={{ id: r.analysisId }} search={{}} className="hover:underline">
                          {r.analysisId}
                        </Link>
                        <p className="max-w-[180px] truncate font-sans text-xs text-muted-foreground">
                          {analysis?.tenderTitle}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <Link to="/standards/$id" params={{ id: r.standardId }} className="font-mono text-xs hover:underline">
                          {r.standardId}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">{std?.title}</p>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{r.aiScore}%</TableCell>
                      <TableCell className="text-sm">{r.reviewer}</TableCell>
                      <TableCell>
                        <StatusBadge status={r.decision} />
                      </TableCell>
                      <TableCell className="max-w-[220px] text-xs text-muted-foreground">
                        {r.comment || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => decide(r, "Approved")}>
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => decide(r, "Rejected")}>
                            Reject
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => decide(r, "Review Requested")}>
                            Request review
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setActive(r);
                              setComment(r.comment);
                            }}
                          >
                            Comment
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setFeedbackFor(r)}>
                            <MessageSquarePlus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reviewer comment</DialogTitle>
          </DialogHeader>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Matches product and safety requirements."
            className="min-h-28"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!active) return;
                decide(active, active.decision === "Pending" ? "Approved" : active.decision, comment);
                setActive(null);
              }}
            >
              Save comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={feedbackFor !== null} onOpenChange={(o) => !o && setFeedbackFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recommendation feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Feedback type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as FeedbackKind)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Comment</Label>
              <Textarea className="mt-1" value={fbComment} onChange={(e) => setFbComment(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackFor(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!feedbackFor) return;
                actions.addFeedback({
                  id: uid("fb"),
                  analysisId: feedbackFor.analysisId,
                  standardId: feedbackFor.standardId,
                  kind,
                  comment: fbComment,
                  createdAt: new Date().toISOString(),
                });
                setFbComment("");
                setFeedbackFor(null);
                toast.success("Feedback recorded", { description: "It now counts towards the analytics." });
              }}
            >
              Submit feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { History as HistoryIcon, Search } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/manakx/AppShell";
import { EmptyState, StatusBadge } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CATEGORIES } from "@/lib/manakx/standards";
import { useStore } from "@/lib/manakx/store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Analysis History — MANAKX" },
      { name: "description", content: "Searchable history of procurement standards analyses with categories, gaps, conflicts and review status." },
      { property: "og:title", content: "Analysis History — MANAKX" },
      { property: "og:description", content: "Reopen any stored procurement analysis and its recommendations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

const PAGE_SIZE = 8;

function HistoryPage() {
  const { analyses, reviews } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [status, setStatus] = useState("All");
  const [decision, setDecision] = useState("All");
  const [page, setPage] = useState(0);

  const filtered = analyses.filter((a) => {
    const decisions = reviews.filter((r) => r.analysisId === a.id).map((r) => r.decision);
    return (
      (cat === "All" || a.category === cat) &&
      (status === "All" || a.status === status) &&
      (decision === "All" || decisions.includes(decision as never)) &&
      (q === "" ||
        `${a.id} ${a.tenderTitle} ${a.reference} ${a.product}`.toLowerCase().includes(q.toLowerCase()))
    );
  });
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <AppShell
      title="Analysis History"
      description="Every analysis stored in this prototype session, with filters and quick reopen."
      crumbs={[{ label: "Analysis History" }]}
    >
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search by analysis ID, tender, reference or product"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <Select value={cat} onValueChange={(v) => { setCat(v); setPage(0); }}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {["All", "Draft", "Completed", "Needs Review", "Approved"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={decision} onValueChange={(v) => { setDecision(v); setPage(0); }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Reviewer decision" /></SelectTrigger>
            <SelectContent>
              {["All", "Approved", "Rejected", "Review Requested", "Pending"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="px-0 py-2">
          {rows.length === 0 ? (
            <EmptyState
              icon={HistoryIcon}
              title="No analyses match these filters"
              description="Try clearing the search box or selecting a different category or status."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Analysis ID</TableHead>
                    <TableHead>Tender</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Reqs</TableHead>
                    <TableHead className="text-right">Standards</TableHead>
                    <TableHead className="text-right">Gaps</TableHead>
                    <TableHead className="text-right">Conflicts</TableHead>
                    <TableHead>Review status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((a) => (
                    <TableRow
                      key={a.id}
                      className="cursor-pointer"
                      onClick={() => navigate({ to: "/analysis/$id", params: { id: a.id }, search: {} })}
                    >
                      <TableCell className="font-mono text-xs">{a.id}</TableCell>
                      <TableCell className="max-w-[280px] truncate font-medium">{a.tenderTitle}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.category}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(a.createdAt).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right">{a.requirements.length}</TableCell>
                      <TableCell className="text-right">{a.recommendations.length}</TableCell>
                      <TableCell className="text-right">{a.gaps.length}</TableCell>
                      <TableCell className="text-right">{a.conflicts.length}</TableCell>
                      <TableCell><StatusBadge status={a.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filtered.length} analyses · page {page + 1} of {pages}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

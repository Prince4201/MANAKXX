import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ClipboardCheck, Info, FileText } from "lucide-react";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/manakx/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/lib/manakx/store";
import { TypeBadge, StatusBadge, ScoreRing, SyntheticBadge, EmptyState } from "@/components/manakx/bits";
import type { Analysis } from "@/lib/manakx/types";

export const Route = createFileRoute("/vendor/procurements")({
  head: () => ({ meta: [{ title: "Available Procurements — MANAKX" }] }),
  component: VendorProcurements,
});

function VendorProcurements() {
  const { analyses, standards } = useStore();
  
  // Vendor rule: Approved/Completed analyses
  const availableProcurements = useMemo(() => 
    analyses.filter((a) => a.status === "Approved" || a.status === "Completed"),
  [analyses]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedProcurement, setSelectedProcurement] = useState<Analysis | null>(null);

  // Derive unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(availableProcurements.map((a) => a.category));
    return ["All", ...Array.from(cats)].sort();
  }, [availableProcurements]);

  // Apply filters
  const filteredProcurements = useMemo(() => {
    return availableProcurements.filter((a) => {
      const matchSearch = 
        a.tenderTitle.toLowerCase().includes(search.toLowerCase()) ||
        a.id.toLowerCase().includes(search.toLowerCase()) ||
        a.product.toLowerCase().includes(search.toLowerCase());
      
      const matchCat = category === "All" || a.category === category;
      return matchSearch && matchCat;
    });
  }, [availableProcurements, search, category]);

  const stdMap = useMemo(() => new Map(standards.map((s) => [s.id, s])), [standards]);

  return (
    <AppShell 
      title="Available Procurements" 
      description="Browse procurement opportunities available for vendor self-assessment." 
      crumbs={[{ label: "Vendor", path: "/vendor" }, { label: "Procurements" }]}
    >
      <div className="mb-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
        <Info className="mr-2 inline h-4 w-4" />
        <strong>Prototype / Synthetic Data</strong> — Not an Official BIS Database. MANAKX provides decision support only and does not represent official BIS guidance or certification.
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by ID, title, or product..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[240px]">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredProcurements.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No procurements found"
          description={
            availableProcurements.length === 0 
            ? "No procurements are currently available for self-assessment. Check back later when new procurement opportunities are published."
            : "No procurements match your search and filter criteria."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProcurements.map((a) => (
            <Card key={a.id} className="flex flex-col transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-primary">{a.id}</span>
                  <StatusBadge status="Open" />
                </div>
                <CardTitle className="mt-2 text-base leading-snug">{a.tenderTitle}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <dl className="mb-4 grid flex-1 grid-cols-2 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Category:</dt>
                  <dd className="font-medium truncate" title={a.category}>{a.category}</dd>
                  <dt className="text-muted-foreground">Product:</dt>
                  <dd className="font-medium truncate" title={a.product}>{a.product}</dd>
                  <dt className="text-muted-foreground">Requirements:</dt>
                  <dd className="font-medium">{a.requirements.length}</dd>
                  <dt className="text-muted-foreground">Published:</dt>
                  <dd className="font-medium">{new Date(a.createdAt).toLocaleDateString()}</dd>
                </dl>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedProcurement(a)}>
                    View Details
                  </Button>
                  <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                    <Link to="/vendor/assessments/new" search={{ procurement: a.id }}>
                      Assess
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={selectedProcurement !== null} onOpenChange={(o) => !o && setSelectedProcurement(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          {selectedProcurement && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-primary">{selectedProcurement.id}</span>
                  <StatusBadge status="Open" />
                </div>
                <DialogTitle className="text-xl">{selectedProcurement.tenderTitle}</DialogTitle>
                <DialogDescription>
                  Published on {new Date(selectedProcurement.createdAt).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-6">
                {/* Overview */}
                <section>
                  <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Overview</h3>
                  <div className="rounded-md border bg-muted/20 p-4">
                    <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                      <div><dt className="text-muted-foreground">Category</dt><dd className="font-medium">{selectedProcurement.category}</dd></div>
                      <div><dt className="text-muted-foreground">Product</dt><dd className="font-medium">{selectedProcurement.product}</dd></div>
                      <div><dt className="text-muted-foreground">Requirements</dt><dd className="font-medium">{selectedProcurement.requirements.length}</dd></div>
                      <div><dt className="text-muted-foreground">Reference</dt><dd className="font-medium">{selectedProcurement.reference}</dd></div>
                    </dl>
                  </div>
                </section>

                {/* Description */}
                <section>
                  <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Description</h3>
                  <div className="rounded-md border bg-muted/20 p-4 text-sm leading-relaxed text-foreground">
                    {selectedProcurement.specText}
                  </div>
                </section>

                {/* Requirements */}
                <section>
                  <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Technical Requirements</h3>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-16">ID</TableHead>
                          <TableHead>Requirement</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Importance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedProcurement.requirements.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">No technical requirements extracted.</TableCell>
                          </TableRow>
                        ) : (
                          selectedProcurement.requirements.map((req, i) => (
                            <TableRow key={req.id}>
                              <TableCell className="font-mono text-xs text-muted-foreground">R{(i+1).toString().padStart(3, '0')}</TableCell>
                              <TableCell className="font-medium">{req.text}</TableCell>
                              <TableCell><TypeBadge type={req.type} /></TableCell>
                              <TableCell><StatusBadge status={req.importance} /></TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </section>

                {/* Standards */}
                {selectedProcurement.recommendations.length > 0 && (
                  <section>
                    <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Applicable Standards</h3>
                    <p className="mb-3 text-xs text-muted-foreground">
                      MANAKX identified these standards because they relate to the technical requirements of this procurement.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {selectedProcurement.recommendations.slice(0, 4).map((rec) => {
                        const std = stdMap.get(rec.standardId);
                        if (!std) return null;
                        return (
                          <Card key={rec.standardId} className="bg-muted/10">
                            <CardContent className="p-4 flex gap-4">
                              <ScoreRing value={rec.relevance} label="Match" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-muted-foreground">{std.id}</span>
                                  <SyntheticBadge />
                                </div>
                                <h4 className="mt-1 font-semibold text-sm leading-tight">{std.title}</h4>
                                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{std.scope}</p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                )}
                
                <div className="pt-4 flex justify-end gap-3 border-t">
                  <Button variant="outline" onClick={() => setSelectedProcurement(null)}>Close</Button>
                  <Button asChild>
                    <Link to="/vendor/assessments/new" search={{ procurement: selectedProcurement.id }}>
                      <ClipboardCheck className="mr-2 h-4 w-4" /> Start Self-Assessment
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

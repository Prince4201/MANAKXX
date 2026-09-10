import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Power } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/manakx/AppShell";
import { StatusBadge } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES } from "@/lib/manakx/standards";
import { actions, useStore } from "@/lib/manakx/store";
import type { Standard } from "@/lib/manakx/types";

export const Route = createFileRoute("/admin/standards")({
  head: () => ({
    meta: [
      { title: "Standards Database — MANAKX Admin" },
      { name: "description", content: "Create, edit and deactivate synthetic standards records used by the MANAKX matching engine." },
      { property: "og:title", content: "Standards Database — MANAKX Admin" },
      { property: "og:description", content: "Full CRUD over the prototype synthetic standards knowledge base." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminStandards,
});

const blank = (): Standard => ({
  id: "",
  title: "",
  category: CATEGORIES[0]!,
  productDomain: "",
  scope: "",
  keywords: [],
  requirementAreas: [],
  applicableProducts: [],
  status: "Active — Demo",
  version: "2026",
  sourceType: "Synthetic",
  lastUpdated: new Date().toISOString().slice(0, 10),
  relatedStandards: [],
  synthetic: true,
});

function AdminStandards() {
  const { standards } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [draft, setDraft] = useState<Standard | null>(null);
  const [isNew, setIsNew] = useState(false);

  const rows = useMemo(
    () =>
      standards.filter(
        (s) =>
          (cat === "All" || s.category === cat) &&
          (q.trim() === "" ||
            `${s.id} ${s.title} ${s.productDomain}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [standards, q, cat],
  );

  const save = () => {
    if (!draft) return;
    if (!draft.id.trim() || !draft.title.trim()) {
      toast.error("ID and title are required");
      return;
    }
    actions.saveStandard({ ...draft, synthetic: true, sourceType: "Synthetic" });
    toast.success(isNew ? "Standard added" : "Standard updated", {
      description: `${draft.id} is now part of the matching knowledge base.`,
    });
    setDraft(null);
  };

  return (
    <AppShell
      title="Standards Database"
      description="All records are synthetic. Edits apply instantly to new analyses."
      crumbs={[{ label: "Administration", to: "/admin" }, { label: "Standards Database" }]}
      actions={
        <Button
          onClick={() => {
            setIsNew(true);
            setDraft({ ...blank(), id: `DEMO-IS-${900 + Math.floor(Math.random() * 99)}` });
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add standard
        </Button>
      }
    >
      <Card className="mb-4">
        <CardContent className="flex flex-wrap gap-3 p-4">
          <Input
            placeholder="Search by ID, title or product domain"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-sm"
          />
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="self-center text-sm text-muted-foreground">{rows.length} records</span>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto px-0 py-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Product domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 60).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.id}</TableCell>
                  <TableCell className="max-w-[320px] truncate">{s.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.category}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.productDomain}</TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsNew(false);
                          setDraft(s);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          actions.toggleStandardStatus(s.id);
                          toast.message("Status updated", { description: `${s.id} toggled.` });
                        }}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length > 60 ? (
            <p className="px-6 py-3 text-xs text-muted-foreground">Showing the first 60 of {rows.length} records.</p>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isNew ? "Add synthetic standard" : "Edit synthetic standard"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Standard ID</Label>
                <Input className="mt-1" value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
              </div>
              <div>
                <Label>Version</Label>
                <Input className="mt-1" value={draft.version} onChange={(e) => setDraft({ ...draft, version: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Title</Label>
                <Input className="mt-1" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Product domain</Label>
                <Input
                  className="mt-1"
                  value={draft.productDomain}
                  onChange={(e) => setDraft({ ...draft, productDomain: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Scope</Label>
                <Textarea className="mt-1" value={draft.scope} onChange={(e) => setDraft({ ...draft, scope: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Keywords (comma separated)</Label>
                <Input
                  className="mt-1"
                  value={draft.keywords.join(", ")}
                  onChange={(e) => setDraft({ ...draft, keywords: splitList(e.target.value) })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Requirement areas (comma separated)</Label>
                <Input
                  className="mt-1"
                  value={draft.requirementAreas.join(", ")}
                  onChange={(e) => setDraft({ ...draft, requirementAreas: splitList(e.target.value) })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Applicable products (comma separated)</Label>
                <Input
                  className="mt-1"
                  value={draft.applicableProducts.join(", ")}
                  onChange={(e) => setDraft({ ...draft, applicableProducts: splitList(e.target.value) })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as Standard["status"] })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active — Demo">Active — Demo</SelectItem>
                    <SelectItem value="Draft — Demo">Draft — Demo</SelectItem>
                    <SelectItem value="Deprecated — Demo">Deprecated — Demo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={save}>Save standard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function splitList(v: string) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

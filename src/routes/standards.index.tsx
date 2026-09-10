import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/manakx/AppShell";
import { EmptyState, StatusBadge, SyntheticBadge } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { similarity, tokenize } from "@/lib/manakx/engine";
import { CATEGORIES } from "@/lib/manakx/standards";
import { useStore } from "@/lib/manakx/store";

export const Route = createFileRoute("/standards/")({
  head: () => ({
    meta: [
      { title: "Standards Search — MANAKX Synthetic Knowledge Base" },
      { name: "description", content: "Search the synthetic Indian Standards knowledge base by ID, title, product, keyword or requirement area." },
      { property: "og:title", content: "Standards Search — MANAKX" },
      { property: "og:description", content: "Explore 87 synthetic demo standards across ten procurement categories." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StandardsSearch,
});

function StandardsSearch() {
  const { standards } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [status, setStatus] = useState("All");
  const [domain, setDomain] = useState("All");
  const [area, setArea] = useState("All");

  const domains = Array.from(new Set(standards.map((s) => s.productDomain))).sort();
  const areas = Array.from(new Set(standards.flatMap((s) => s.requirementAreas))).sort();

  const qset = new Set(tokenize(q));
  const results = standards
    .filter(
      (s) =>
        (cat === "All" || s.category === cat) &&
        (status === "All" || s.status === status) &&
        (domain === "All" || s.productDomain === domain) &&
        (area === "All" || s.requirementAreas.includes(area)),
    )
    .map((s) => {
      const hay = `${s.id} ${s.title} ${s.scope} ${s.keywords.join(" ")} ${s.applicableProducts.join(" ")} ${s.requirementAreas.join(" ")}`;
      const exact = q.trim() !== "" && hay.toLowerCase().includes(q.trim().toLowerCase());
      const rel = q.trim() === "" ? 0 : Math.round(similarity(qset, new Set(tokenize(hay))) * 160);
      return { s, score: exact ? Math.max(70, rel) : rel };
    })
    .filter((r) => q.trim() === "" || r.score > 8)
    .sort((a, b) => b.score - a.score || a.s.id.localeCompare(b.s.id));

  return (
    <AppShell
      title="Standards Search"
      description="Synthetic knowledge base of demo standards used by the recommendation engine."
      crumbs={[{ label: "Standards Search" }]}
    >
      <Card>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[1.4fr_repeat(4,0.9fr)]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search by ID, title, product, keyword or requirement"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={domain} onValueChange={setDomain}>
            <SelectTrigger><SelectValue placeholder="Product domain" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All domains</SelectItem>
              {domains.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger><SelectValue placeholder="Requirement area" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All requirement areas</SelectItem>
              {areas.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {["All", "Active — Demo", "Draft — Demo", "Deprecated — Demo"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <p className="mt-4 text-sm text-muted-foreground">{results.length} standards found</p>

      {results.length === 0 ? (
        <EmptyState
          className=""
          icon={Search}
          title="No standards matched"
          description="No sufficiently relevant standards were found in the prototype knowledge base. Try a broader keyword or clear the filters."
        />
      ) : (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {results.map(({ s, score }) => (
            <Card key={s.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate({ to: "/standards/$id", params: { id: s.id } })}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{s.id}</span>
                  <StatusBadge status={s.status} />
                  <SyntheticBadge />
                  {score > 0 ? (
                    <span className="ml-auto rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {Math.min(99, score)}% match
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-1.5 font-display text-sm font-semibold">{s.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.scope}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {s.category} · {s.productDomain} · {s.requirementAreas.join(", ")}
                </p>
                <Button variant="link" size="sm" className="mt-1 h-auto p-0">
                  View standard details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

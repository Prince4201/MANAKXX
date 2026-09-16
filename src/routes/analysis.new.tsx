import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileText, FlaskConical, Upload, Wand2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/manakx/AppShell";
import { SectionTitle } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { detectConflicts, detectGaps, extractRequirements, recommend } from "@/lib/manakx/engine";
import { SCENARIOS } from "@/lib/manakx/scenarios";
import { CATEGORIES, PRODUCTS_BY_CATEGORY } from "@/lib/manakx/standards";
import { actions, getState, useStore } from "@/lib/manakx/store";
import type { Analysis } from "@/lib/manakx/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analysis/new")({
  head: () => ({
    meta: [
      { title: "New Analysis — MANAKX" },
      { name: "description", content: "Upload a tender, paste a specification or load a demo scenario to analyse applicable standards." },
      { property: "og:title", content: "New Procurement Analysis — MANAKX" },
      { property: "og:description", content: "Start a standards analysis from a tender document, pasted text or a demo scenario." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewAnalysis,
});

function NewAnalysis() {
  const navigate = useNavigate();
  const { user, analyses } = useStore();
  const [category, setCategory] = useState<string>("Industrial & Manufacturing");
  const [product, setProduct] = useState<string>("Safety Helmet");
  const [method, setMethod] = useState<"Demo" | "Paste" | "Upload">("Demo");
  const [scenarioKey, setScenarioKey] = useState("helmet");
  const [pasted, setPasted] = useState("");
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileText, setFileText] = useState<string>("");
  const [fileNote, setFileNote] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const products = PRODUCTS_BY_CATEGORY[category] ?? [];
  const scenariosForCategory = SCENARIOS.filter((s) => s.category === category);
  const scenario = SCENARIOS.find((s) => s.key === scenarioKey);

  const onFile = async (file: File) => {
    const ok = /\.(pdf|docx?|txt|md)$/i.test(file.name);
    if (!ok) {
      toast.error("Unsupported file type", { description: "Upload a PDF, DOCX or plain-text specification." });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File too large", { description: "Please upload a file under 8 MB." });
      return;
    }
    setFileName(file.name);
    if (/\.(txt|md)$/i.test(file.name)) {
      const text = await file.text();
      setFileText(text);
      setFileNote(`Extracted ${text.split(/\s+/).length} words of specification text from ${file.name}.`);
      toast.success("Text extracted from uploaded file");
    } else {
      setFileText("");
      setFileNote(
        `${file.name} received. In-browser extraction of PDF/DOCX binaries is not performed in this prototype — paste the specification text, or continue with a matching demo tender so the analysis stays honest about its input.`,
      );
      toast.message("Document received", { description: "Binary parsing is not simulated — choose a text source below." });
    }
  };

  const run = () => {
    let specText = "";
    let sourceName = "";
    let tenderTitle = title.trim();
    let reference = `TND/AUTO/${new Date().getFullYear()}/${Math.floor(Math.random() * 900 + 100)}`;

    if (method === "Demo") {
      if (!scenario) {
        toast.error("Select a demo tender to continue");
        return;
      }
      specText = scenario.text;
      sourceName = `${scenario.name} demo tender`;
      tenderTitle = tenderTitle || scenario.tenderTitle;
      reference = scenario.reference;
    } else if (method === "Paste") {
      specText = pasted.trim();
      sourceName = "Pasted specification";
      if (specText.length < 40) {
        toast.error("Specification is too short", {
          description: "Paste at least a few requirement sentences so the engine has something to extract.",
        });
        return;
      }
      tenderTitle = tenderTitle || `${product} procurement specification`;
    } else {
      specText = fileText.trim();
      sourceName = fileName ?? "Uploaded document";
      if (!specText) {
        toast.error("No readable text from the upload", {
          description: "Paste the specification text instead, or use a demo tender.",
        });
        return;
      }
      tenderTitle = tenderTitle || `${product} — ${fileName}`;
    }

    if (!category || !product) {
      toast.error("Select a category and product first");
      return;
    }

    const requirements = extractRequirements(specText, product);
    if (requirements.length === 0) {
      toast.error("No technical requirements could be extracted", {
        description: "Add requirement sentences describing material, performance, safety or testing.",
      });
      return;
    }
    const weights = getState().weights;
    const standards = getState().standards;
    const recommendations = recommend(requirements, category, product, weights, standards);

    const id = `ANL-2026-${1001 + analyses.length + 30}`;
    const analysis: Analysis = {
      id,
      tenderTitle,
      reference,
      category,
      product,
      inputMethod: method,
      sourceName,
      specText,
      requirements,
      recommendations,
      gaps: detectGaps(requirements),
      conflicts: detectConflicts(specText, requirements),
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      createdBy: user?.name ?? "Demo Officer",
    };
    actions.addAnalysis(analysis);
    navigate({ to: "/analysis/$id", params: { id }, search: { run: "1" } });
  };

  return (
    <AppShell
      title="New Analysis"
      description="Select the procurement domain, provide the specification, and run the MANAKX analysis pipeline."
      crumbs={[{ label: "New Analysis" }]}
    >
      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step 1 · Procurement category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={category}
                    onValueChange={(v) => {
                      setCategory(v);
                      setProduct(PRODUCTS_BY_CATEGORY[v]?.[0] ?? "");
                      const first = SCENARIOS.find((s) => s.category === v);
                      if (first) setScenarioKey(first.key);
                    }}
                  >
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
                  <Label>Product / item</Label>
                  <Select value={product} onValueChange={setProduct}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="title">Tender / project title (optional)</Label>
                <Input
                  id="title"
                  className="mt-1"
                  placeholder="e.g. Supply of industrial safety helmets"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step 2 · Specification input</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={method} onValueChange={(v) => setMethod(v as typeof method)}>
                <TabsList>
                  <TabsTrigger value="Demo">
                    <FlaskConical className="mr-1.5 h-4 w-4" /> Demo tender
                  </TabsTrigger>
                  <TabsTrigger value="Paste">
                    <FileText className="mr-1.5 h-4 w-4" /> Paste specification
                  </TabsTrigger>
                  <TabsTrigger value="Upload">
                    <Upload className="mr-1.5 h-4 w-4" /> Upload document
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="Demo" className="mt-4 space-y-3">
                  {(scenariosForCategory.length ? scenariosForCategory : SCENARIOS).map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => {
                        setScenarioKey(s.key);
                        setCategory(s.category);
                        setProduct(s.product);
                      }}
                      className={cn(
                        "w-full rounded-lg border p-3 text-left transition-colors",
                        scenarioKey === s.key ? "border-primary bg-primary/5" : "hover:bg-muted/60",
                      )}
                    >
                      <p className="text-sm font-medium">{s.tenderTitle}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {s.reference} · {s.category} · {s.product}
                      </p>
                    </button>
                  ))}
                  {scenario ? (
                    <div className="rounded-md border bg-muted/40 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Specification preview
                      </p>
                      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs leading-relaxed">
                        {scenario.text}
                      </pre>
                    </div>
                  ) : null}
                </TabsContent>

                <TabsContent value="Paste" className="mt-4">
                  <Label htmlFor="spec">Specification text</Label>
                  <Textarea
                    id="spec"
                    className="mt-1 min-h-56 font-mono text-xs"
                    placeholder={"One requirement per line, e.g.\nThe helmet shall provide impact protection...\nShell material shall be HDPE..."}
                    value={pasted}
                    onChange={(e) => setPasted(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {pasted.trim() ? `${pasted.trim().split(/\s+/).length} words` : "Free text — the engine parses sentences and bullet lines."}
                  </p>
                </TabsContent>

                <TabsContent value="Upload" className="mt-4">
                  <div
                    className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files?.[0];
                      if (f) void onFile(f);
                    }}
                  >
                    <Upload className="h-7 w-7 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">Drop the tender document here</p>
                    <p className="text-xs text-muted-foreground">PDF, DOCX or plain text · max 8 MB</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => fileRef.current?.click()}>
                      Choose file
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.md"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void onFile(f);
                      }}
                    />
                  </div>
                  {fileName ? (
                    <div className="mt-3 rounded-md border bg-muted/40 p-3 text-xs">
                      <p className="font-medium">{fileName}</p>
                      <p className="mt-1 text-muted-foreground">{fileNote}</p>
                      {!fileText ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => {
                            const s = SCENARIOS.find((x) => x.product === product) ?? SCENARIOS[0]!;
                            setFileText(s.text);
                            setFileNote(`Using the ${s.name} demo specification text in place of the binary document.`);
                            toast.success("Demo specification text loaded for this document");
                          }}
                        >
                          Use matching demo specification text
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={run}>
              <Wand2 className="mr-1.5 h-4 w-4" /> Analyze Specification
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                setMethod("Demo");
                setCategory("Industrial & Manufacturing");
                setProduct("Safety Helmet");
                setScenarioKey("helmet");
                toast.success("Demo tender loaded", { description: "Industrial Safety Helmet scenario ready to analyse." });
              }}
            >
              Launch Demo (Safety Helmet)
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">What happens next</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {[
                "Text is normalised and split into requirement statements",
                "Each statement is classified and scored for confidence",
                "Candidate standards are retrieved from the synthetic knowledge base",
                "Standards are ranked with a transparent weighted score",
                "Coverage, potential gaps and conflicts are computed",
              ].map((s, i) => (
                <p key={s} className="flex gap-2">
                  <span className="font-mono text-xs text-primary">0{i + 1}</span>
                  {s}
                </p>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">AI confidence & limitations</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <SectionTitle title="" />
              MANAKX provides decision support, not legal or regulatory certification. All standards in this prototype are
              synthetic records generated for demonstration; they are not official BIS documents and must not be cited as
              compliance evidence.
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

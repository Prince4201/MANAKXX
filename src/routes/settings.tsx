import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/manakx/AppShell";
import { SectionTitle } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_WEIGHTS } from "@/lib/manakx/engine";
import { actions, useStore } from "@/lib/manakx/store";
import type { Weights } from "@/lib/manakx/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — MANAKX" },
      { name: "description", content: "Tune the local matching engine weights, switch theme, manage your demo profile and reset prototype data." },
      { property: "og:title", content: "Settings — MANAKX" },
      { property: "og:description", content: "Configure scoring weights and prototype preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const LABELS: Record<keyof Weights, string> = {
  productDomain: "Product / domain match",
  requirementSimilarity: "Requirement similarity",
  scope: "Scope match",
  keywords: "Keyword match",
  category: "Category match",
};

function SettingsPage() {
  const { weights, theme, user } = useStore();
  const [local, setLocal] = useState<Weights>(weights);
  const [name, setName] = useState(user?.name ?? "");
  const total = Object.values(local).reduce((a, b) => a + b, 0);

  return (
    <AppShell title="Settings" description="Profile, appearance and matching engine configuration." crumbs={[{ label: "Settings" }]}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Demo account stored locally in this browser.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Display name</Label>
              <Input id="name" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Role</Label>
              <p className="mt-1 text-sm text-muted-foreground">{user?.role ?? "Procurement Officer"}</p>
            </div>
            <Button
              onClick={() => {
                if (!user) return;
                actions.login({ ...user, name: name || user.name });
                toast.success("Profile updated");
              }}
            >
              Save profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
            <CardDescription>Theme preference is remembered on this device.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Theme</Label>
              <Select value={theme} onValueChange={(v) => actions.setTheme(v as "light" | "dark")}>
                <SelectTrigger className="mt-1 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium">Reset prototype data</p>
              <p className="mb-3 text-sm text-muted-foreground">
                Clears your analyses, reviews and feedback and restores the seeded demo dataset.
              </p>
              <Button
                variant="destructive"
                onClick={() => {
                  actions.resetDemoData();
                  toast.success("Demo data reset");
                }}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" /> Reset demo data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <SectionTitle title="Matching engine weights" description="Changing these changes how future analyses are scored. Weights should total 100." />
      <Card>
        <CardContent className="space-y-6 p-6">
          {(Object.keys(LABELS) as (keyof Weights)[]).map((k) => (
            <div key={k}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">{LABELS[k]}</span>
                <span className="font-mono text-muted-foreground">{local[k]}</span>
              </div>
              <Slider
                value={[local[k]]}
                min={0}
                max={60}
                step={1}
                onValueChange={([v]) => setLocal((p) => ({ ...p, [k]: v ?? 0 }))}
              />
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-sm ${total === 100 ? "text-muted-foreground" : "text-destructive"}`}>
              Total: {total} / 100
            </span>
            <Button
              disabled={total !== 100}
              onClick={() => {
                actions.setWeights(local);
                toast.success("Scoring weights saved", { description: "New analyses will use these weights." });
              }}
            >
              Save weights
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setLocal(DEFAULT_WEIGHTS);
                actions.setWeights(DEFAULT_WEIGHTS);
                toast.message("Weights restored to defaults");
              }}
            >
              Restore defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      <SectionTitle title="Known limitations" />
      <Card>
        <CardContent className="space-y-2 p-6 text-sm text-muted-foreground">
          <p>· All standards, analyses and scores are synthetic and generated locally for demonstration.</p>
          <p>· This prototype is not connected to any official BIS database and makes no compliance claims.</p>
          <p>· Uploads are read as plain text; PDF and DOCX content must be pasted or demo text used instead.</p>
          <p>· The matching engine is a deterministic local simulation, not a hosted machine-learning model.</p>
        </CardContent>
      </Card>
    </AppShell>
  );
}

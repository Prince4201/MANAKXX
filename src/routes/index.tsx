import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  BrainCircuit,
  CircuitBoard,
  ClipboardList,
  FileText,
  Gauge,
  HardHat,
  Layers,
  Leaf,
  Lock,
  Play,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Truck,
  Wheat,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/manakx/AppShell";
import { DisclaimerBar } from "@/components/manakx/bits";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MANAKX — AI Indian Standards Recommendation for Procurement" },
      {
        name: "description",
        content:
          "MANAKX turns procurement specifications into explainable, standards-based recommendations with gap detection, conflict checks and human review.",
      },
      { property: "og:title", content: "MANAKX — Standards Intelligence for Procurement" },
      {
        property: "og:description",
        content:
          "Understand. Match. Explain. Review. An AI recommendation engine for applicable Indian Standards in procurement specifications.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const CATEGORIES = [
  { icon: CircuitBoard, label: "Electronics & Electrical" },
  { icon: Wheat, label: "Food & Agriculture" },
  { icon: Stethoscope, label: "Healthcare & Medical" },
  { icon: HardHat, label: "Construction & Infrastructure" },
  { icon: Boxes, label: "Industrial & Manufacturing" },
  { icon: Truck, label: "Automotive & Transport" },
  { icon: Zap, label: "Chemicals" },
  { icon: Layers, label: "Textiles" },
  { icon: Leaf, label: "Environment" },
  { icon: Gauge, label: "Mechanical Engineering" },
];

const FLOW = [
  { icon: ClipboardList, label: "Tender text", note: "Paste, upload or load a demo specification" },
  { icon: ScanSearch, label: "Requirement extraction", note: "Typed, weighted, confidence-scored clauses" },
  { icon: Boxes, label: "Standards matching", note: "Transparent five-factor similarity model" },
  { icon: BadgeCheck, label: "Recommendation", note: "Ranked standards with the evidence attached" },
  { icon: ShieldCheck, label: "Human review", note: "Accept, reject or escalate every match" },
  { icon: FileText, label: "Report", note: "Print-ready procurement analysis document" },
];

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "Explainable matching engine",
    text: "Domain, requirement similarity, scope, keywords and category are scored separately and shown side by side — every number can be traced back to the clause that produced it.",
    span: "lg:col-span-2 lg:row-span-2",
  },
  { icon: ScanSearch, title: "Requirement extraction", text: "Free-form tender text becomes typed requirements with importance and confidence." },
  { icon: Layers, title: "Gap detection", text: "Flags requirement areas the specification appears to be missing." },
  { icon: ShieldAlert, title: "Conflict detection", text: "Catches inverted limits, clashing materials and duplicated clauses before publishing." },
  { icon: ShieldCheck, title: "Human-in-the-loop", text: "Reviewer decisions and feedback flow straight into the analytics." },
  {
    icon: FileText,
    title: "Audit-ready reporting",
    text: "One document covering requirements, matches, gaps, conflicts and review outcomes — ready to print or save as PDF.",
    span: "lg:col-span-2",
  },
];

const DIFFERENTIATORS = [
  { icon: Sparkles, title: "Deterministic, not a black box", text: "The same specification always produces the same ranked output, and each score is broken down on screen." },
  { icon: Lock, title: "Runs fully offline", text: "No API keys, no external model calls, no network dependency during a live demo." },
  { icon: ShieldCheck, title: "Honest by design", text: "Synthetic records are clearly labelled and the product never claims official certification." },
];

const SCENARIOS = [
  "Industrial safety helmets",
  "Low voltage power cables",
  "Medical examination gloves",
  "Food packaging laminate",
  "Ordinary Portland cement",
  "Solar LED street lighting",
];

function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-background">
      {/* ---------- HERO ---------- */}
      <div className="manakx-ink relative overflow-hidden">
        <div className="aurora-ink pointer-events-none absolute inset-0" />
        <div className="surface-grid pointer-events-none absolute inset-0 opacity-[0.05]" />
        <div className="saffron-rule absolute inset-x-0 top-0 h-1" />

        {/* Ghost typography backdrop */}
        <p aria-hidden className="ghost-word pointer-events-none absolute -bottom-[3.5vw] left-0 z-0 hidden text-[19vw] tracking-tight lg:block">
          MANAKX
        </p>

        {/* Orbital standards ring (desktop) */}
        <div aria-hidden className="pointer-events-none absolute -right-40 top-1/2 hidden h-[46rem] w-[46rem] -translate-y-1/2 lg:block">
          <div className="spin-slow absolute inset-0 rounded-full border border-dashed border-foreground/15" />
          <div className="spin-slow-rev absolute inset-16 rounded-full border border-foreground/10" />
          <div className="absolute inset-40 rounded-full border border-accent/20" />
          <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent node-glow" />
          <span className="absolute bottom-10 right-16 h-2 w-2 rounded-full bg-success/80" />
          <span className="absolute left-10 top-1/3 h-2 w-2 rounded-full bg-info/80" />
        </div>

        <header className="relative z-30">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
            <div className="ink-text">
              <Logo />
            </div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="ink-muted hidden hover:bg-foreground/10 hover:text-foreground sm:inline-flex"
              >
                <Link to="/standards">Standards</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="ink-muted hidden hover:bg-foreground/10 hover:text-foreground sm:inline-flex"
              >
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-9 lg:grid-cols-[1.04fr_0.96fr] lg:px-8 lg:pb-24 lg:pt-16">
          <div className="rise max-w-2xl">
            <span className="inline-flex items-center gap-2 border-l-2 border-accent bg-foreground/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider ink-text backdrop-blur-md">
              Smart India Hackathon 2026 · SIH26108
            </span>

            <h1 className="mt-7 font-display text-[2.65rem] font-semibold leading-[1.04] ink-text sm:text-6xl lg:text-[4.4rem]">
              Standards intelligence for every procurement decision.
            </h1>

            <p className="ink-muted mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
              Turn tender specifications into ranked, explainable Indian Standards recommendations—with requirement
              evidence, gap checks and human review built into one working flow.
            </p>

            <p className="mt-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-accent">
              <span className="h-px w-10 bg-accent" /> Understand · Match · Explain · Review
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="glow-accent h-12 rounded-md bg-accent px-6 font-semibold text-accent-foreground hover:bg-accent/90"
              >
                <Link to="/login" search={{ demo: "1" }}>
                  <Play className="mr-1.5 h-4 w-4" /> Launch live demo
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="ink-panel h-12 rounded-md px-6 ink-text hover:bg-foreground/15 hover:text-foreground"
              >
                <Link to="/analysis/new">
                  Start an analysis <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 border-y border-foreground/15 py-5">
              {[
                ["87", "Synthetic standards"],
                ["10", "Procurement domains"],
                ["6", "Ready demo tenders"],
              ].map(([v, l]) => (
                <div key={l} className="border-r border-foreground/15 px-4 last:border-r-0 first:pl-0">
                  <dt className="font-display text-2xl font-semibold tabular-nums ink-text">{v}</dt>
                  <dd className="ink-muted mt-1 text-[10px] font-medium uppercase leading-tight tracking-wide">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Live-looking product panel */}
          <div className="rise relative self-end lg:translate-y-10 [animation-delay:120ms]">
            <div className="floaty ink-panel relative overflow-hidden rounded-lg p-5 shadow-2xl">
              <div className="scanline pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-success/20 to-transparent" />
              <div className="flex items-center justify-between">
                <p className="ink-muted text-[11px] font-semibold uppercase tracking-[0.18em]">Analysis · live output</p>
                <span className="rounded-sm bg-success/20 px-2 py-0.5 text-[10px] font-semibold text-success">
                  Completed
                </span>
              </div>

              <div className="mt-4 rounded-md border border-foreground/10 bg-background/20 p-4">
                <p className="ink-muted text-[11px]">Extracted requirement</p>
                <p className="mt-1.5 text-sm font-medium ink-text">
                  “The helmet shall provide impact protection against falling objects during industrial use.”
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["Safety", "Mandatory", "Confidence 0.92"].map((t) => (
                    <span key={t} className="rounded-sm bg-foreground/10 px-2 py-0.5 text-[10px] font-medium ink-text">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                {[
                  ["DEMO-IS-045", "Industrial Protective Headgear", 96, "Highly Relevant"],
                  ["DEMO-IS-046", "Impact and Penetration Testing", 84, "Relevant"],
                  ["DEMO-IS-047", "Retention Systems for Head Protection", 71, "Partial"],
                ].map(([id, title, score, band]) => (
                  <div
                    key={id as string}
                    className="flex items-center gap-3 rounded-md border border-foreground/10 bg-foreground/[0.06] p-3"
                  >
                    <span className="grid h-11 w-12 shrink-0 place-items-center rounded-md bg-accent/20 font-display text-sm font-bold text-accent">
                      {score}%
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium ink-text">{title}</p>
                      <p className="ink-muted text-[11px]">
                        {id} · {band}
                      </p>
                       <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-foreground/10">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="ink-muted mt-4 pb-8 text-[11px] sm:pr-32">
                Produced by the local matching engine — no external AI service, no API key.
              </p>
            </div>

            <div className="ink-panel floaty absolute -bottom-6 -left-6 hidden rounded-md border-l-2 border-l-accent px-4 py-3 shadow-xl [animation-delay:1.4s] sm:block">
              <p className="ink-muted text-[10px] uppercase tracking-wide">Conflicts found</p>
              <p className="font-display text-lg font-semibold text-accent">1 quantity clash</p>
            </div>

            <div className="ink-panel floaty absolute -top-16 right-0 hidden rounded-md border-l-2 border-l-success px-4 py-3 shadow-xl [animation-delay:0.7s] lg:block">
              <p className="ink-muted text-[10px] uppercase tracking-wide">Knowledge base</p>
              <p className="font-display text-lg font-semibold text-success">87 standards indexed</p>
            </div>
          </div>
        </section>

        {/* Category marquee */}
        <div className="relative z-10 border-t border-foreground/10 bg-background/5 py-5 backdrop-blur-md">
          <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
            <div className="marquee-track flex shrink-0 gap-10 pr-10">
              {[...CATEGORIES, ...CATEGORIES].map((c, i) => (
                <span key={i} className="ink-muted flex shrink-0 items-center gap-2 text-sm font-medium">
                  <c.icon className="h-4 w-4 text-accent" />
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- PIPELINE ---------- */}
      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-end md:gap-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-foreground">01 · The workflow</p>
          <div className="max-w-3xl">
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            Six steps from raw tender text to a defensible recommendation
          </h2>
          <p className="mt-3 text-muted-foreground">
            Each stage is visible in the product — nothing happens behind a loading spinner you can't inspect.
          </p>
          </div>
        </div>

        <div className="relative mt-10 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block" />
          {FLOW.map((f, i) => (
            <div
              key={f.label}
              className="group relative rounded-md border bg-card p-4 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-4.5 w-4.5" />
              </span>
              <p className="mt-3 font-display text-sm font-semibold">{f.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.note}</p>
              <span className="absolute right-3 top-3 font-display text-xs font-bold text-muted-foreground/40">
                0{i + 1}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- BENTO FEATURES ---------- */}
      <section className="border-y bg-muted/50">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-foreground">02 · Capabilities</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Built for procurement teams, not for demos alone
            </h2>
          </div>

          <div className="mt-10 grid auto-rows-[minmax(150px,auto)] gap-4 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`group rounded-md border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl ${f.span ?? ""}`}
              >
                <span className="grid h-11 w-11 place-items-center rounded-md bg-accent/15 text-accent-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- DIFFERENTIATORS ---------- */}
      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-foreground">03 · Why it holds up</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              A prototype that can be questioned — and still stands
            </h2>
            <p className="mt-4 text-muted-foreground">
              MANAKX is designed to be interrogated live: open any recommendation, and the requirement, the matched
              evidence and the weight behind each score are all on screen.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {SCENARIOS.map((s) => (
                <span key={s} className="rounded-sm border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {DIFFERENTIATORS.map((d) => (
              <div key={d.title} className="flex gap-4 rounded-md border bg-card p-5 shadow-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <d.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold">{d.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{d.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="manakx-ink relative overflow-hidden rounded-lg border border-primary/20 px-6 py-16 text-center shadow-2xl">
          <div className="aurora-ink pointer-events-none absolute inset-0" />
          <div className="surface-grid pointer-events-none absolute inset-0 opacity-[0.07]" />
          <div className="relative">
            <h2 className="mx-auto max-w-3xl font-display text-3xl font-semibold ink-text sm:text-4xl">
              Run the whole flow in about a minute
            </h2>
            <p className="ink-muted mx-auto mt-3 max-w-2xl">
              Load a tender, watch the ten-stage pipeline, review the recommendations, resolve the conflicts and
              generate the report — end to end, with synthetic data.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="glow-accent h-12 rounded-md bg-accent px-6 text-accent-foreground hover:bg-accent/90"
              >
                <Link to="/login" search={{ demo: "1" }}>
                  Launch demo <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="ink-panel h-12 rounded-md px-6 ink-text hover:bg-foreground/15 hover:text-foreground"
              >
                <Link to="/standards">Browse the knowledge base</Link>
              </Button>
            </div>
          </div>
        </div>
        <DisclaimerBar className="mt-8" />
      </section>

      <footer className="border-t py-10 text-center text-xs text-muted-foreground">
        MANAKX · Intelligent Indian Standards Recommendation for Procurement · Prototype uses synthetic standards data
        for demonstration purposes and does not represent official BIS guidance.
      </footer>
    </div>
  );
}

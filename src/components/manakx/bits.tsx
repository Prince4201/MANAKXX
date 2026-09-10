import { Link } from "@tanstack/react-router";
import { FlaskConical, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SyntheticBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning-foreground",
        className,
      )}
    >
      <FlaskConical className="h-3 w-3" />
      Synthetic demo standard
    </span>
  );
}

export function DisclaimerBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border border-warning/35 bg-warning/10 px-3 py-2.5 text-xs text-foreground shadow-sm",
        className,
      )}
    >
      <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning-foreground" />
      <span><strong className="font-semibold">Prototype / Synthetic Data — Not an Official BIS Database.</strong>{" "}
      MANAKX provides decision support only and does not represent official BIS guidance or certification.</span>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Completed: "bg-info/15 text-info border-info/30",
    Approved: "bg-success/15 text-success border-success/30",
    "Needs Review": "bg-warning/20 text-warning-foreground border-warning/40",
    Draft: "bg-muted text-muted-foreground border-border",
    Rejected: "bg-destructive/15 text-destructive border-destructive/30",
    "Review Requested": "bg-warning/20 text-warning-foreground border-warning/40",
    Pending: "bg-muted text-muted-foreground border-border",
    "Active — Demo": "bg-success/15 text-success border-success/30",
    "Deprecated — Demo": "bg-destructive/15 text-destructive border-destructive/30",
    "Draft — Demo": "bg-muted text-muted-foreground border-border",
    High: "bg-destructive/15 text-destructive border-destructive/30",
    Medium: "bg-warning/20 text-warning-foreground border-warning/40",
    Low: "bg-muted text-muted-foreground border-border",
    Strong: "bg-success/15 text-success border-success/30",
    Partial: "bg-warning/20 text-warning-foreground border-warning/40",
    "No Match": "bg-muted text-muted-foreground border-border",
    "Highly Relevant": "bg-success/15 text-success border-success/30",
    Relevant: "bg-info/15 text-info border-info/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        map[status] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {status}
    </span>
  );
}

export function ScoreRing({ value, label }: { value: number; label?: string }) {
  const tone = value >= 72 ? "var(--success)" : value >= 48 ? "var(--info)" : "var(--warning)";
  return (
    <div className="flex flex-col items-center">
      <div
        className="grid h-14 w-14 place-items-center rounded-full text-sm font-semibold"
        style={{
          background: `conic-gradient(${tone} ${value * 3.6}deg, color-mix(in oklab, var(--muted) 90%, transparent) 0deg)`,
        }}
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-card">{value}%</span>
      </div>
      {label ? <span className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span> : null}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  to,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  to?: string;
}) {
  const body = (
    <Card className="group overflow-hidden border-border/80 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
          {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-4.5 w-4.5" />
        </span>
      </CardContent>
    </Card>
  );
  return to ? (
    <Link to={to} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center", className)}>
      {Icon ? <Icon className="mb-3 h-8 w-8 text-muted-foreground" /> : null}
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
      {type}
    </Badge>
  );
}

export function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

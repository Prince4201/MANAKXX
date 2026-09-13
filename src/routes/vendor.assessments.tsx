import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/manakx/AppShell";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/vendor/assessments")({
  head: () => ({ meta: [{ title: "Self-Assessments — MANAKX" }] }),
  component: () => (
    <AppShell title="Self-Assessments" description="Your active procurement self-assessments." crumbs={[{ label: "Vendor", path: "/vendor" }, { label: "Assessments" }]}>
      <Card className="border-dashed"><CardContent className="p-12 text-center text-muted-foreground">You have not started any self-assessments.</CardContent></Card>
    </AppShell>
  ),
});

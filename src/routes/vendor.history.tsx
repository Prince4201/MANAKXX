import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/manakx/AppShell";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/vendor/history")({
  head: () => ({ meta: [{ title: "Assessment History — MANAKX" }] }),
  component: () => (
    <AppShell title="Assessment History" description="View past self-assessment results." crumbs={[{ label: "Vendor", path: "/vendor" }, { label: "History" }]}>
      <Card className="border-dashed"><CardContent className="p-12 text-center text-muted-foreground">You have no assessment history.</CardContent></Card>
    </AppShell>
  ),
});

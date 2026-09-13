import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/manakx/AppShell";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/vendor/documents")({
  head: () => ({ meta: [{ title: "Documents — MANAKX" }] }),
  component: () => (
    <AppShell title="Document Library" description="Manage your uploaded product datasheets and certificates." crumbs={[{ label: "Vendor", path: "/vendor" }, { label: "Documents" }]}>
      <Card className="border-dashed"><CardContent className="p-12 text-center text-muted-foreground">Document upload feature is coming soon.</CardContent></Card>
    </AppShell>
  ),
});

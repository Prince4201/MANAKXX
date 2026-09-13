import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/manakx/AppShell";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/vendor/products")({
  head: () => ({ meta: [{ title: "My Products — MANAKX" }] }),
  component: () => (
    <AppShell title="My Products" description="Manage your registered product catalog." crumbs={[{ label: "Vendor", path: "/vendor" }, { label: "Products" }]}>
      <Card className="border-dashed"><CardContent className="p-12 text-center text-muted-foreground">Product catalog feature is coming soon.</CardContent></Card>
    </AppShell>
  ),
});

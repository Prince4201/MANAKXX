import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/manakx/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/manakx/store";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

export const Route = createFileRoute("/vendor/profile")({
  head: () => ({ meta: [{ title: "Vendor Profile — MANAKX" }] }),
  component: VendorProfile,
});

function VendorProfile() {
  const { user } = useStore();

  return (
    <AppShell title="Vendor / Supplier Profile" description="Manage your company details and credentials." crumbs={[{ label: "Vendor", path: "/vendor" }, { label: "Profile" }]}>
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Registered supplier details</CardDescription>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <Package className="mr-1 h-3 w-3" /> Registered Supplier
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Representative Name</Label>
                <Input defaultValue={user?.name} disabled />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input defaultValue={user?.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input defaultValue={user?.company_name || "Demo Manufacturing Co."} disabled />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input defaultValue={user?.industry || "Manufacturing"} disabled />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

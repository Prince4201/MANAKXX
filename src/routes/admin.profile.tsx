import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/manakx/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/manakx/store";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({ meta: [{ title: "Admin Profile — MANAKX" }] }),
  component: AdminProfile,
});

function AdminProfile() {
  const { user } = useStore();

  return (
    <AppShell title="System Administrator Profile" description="Manage your superuser account." crumbs={[{ label: "Admin", path: "/admin" }, { label: "Profile" }]}>
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>System Administrator</CardTitle>
              <CardDescription>Full system access</CardDescription>
            </div>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <ShieldCheck className="mr-1 h-3 w-3" /> Superuser
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input defaultValue={user?.name} disabled />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input defaultValue={user?.email} disabled />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/manakx/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/manakx/store";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, User } from "lucide-react";

export const Route = createFileRoute("/officer/profile")({
  head: () => ({ meta: [{ title: "Officer Profile — MANAKX" }] }),
  component: OfficerProfile,
});

function OfficerProfile() {
  const { user } = useStore();

  return (
    <AppShell title="Officer Profile" description="Manage your procurement officer account." crumbs={[{ label: "Profile" }]}>
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Government Procurement Officer</CardTitle>
              <CardDescription>Official government credentials</CardDescription>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <ShieldCheck className="mr-1 h-3 w-3" /> Verified Officer
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
              <div className="space-y-2">
                <Label>Department</Label>
                <Input defaultValue={user?.department || "Defense Procurement"} disabled />
              </div>
              <div className="space-y-2">
                <Label>Organization</Label>
                <Input defaultValue={user?.organization || "Ministry of Defense"} disabled />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

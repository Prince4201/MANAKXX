import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/manakx/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/manakx/store";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/reviewer/profile")({
  head: () => ({ meta: [{ title: "Reviewer Profile — MANAKX" }] }),
  component: ReviewerProfile,
});

function ReviewerProfile() {
  const { user } = useStore();

  return (
    <AppShell title="Reviewer Profile" description="Manage your technical reviewer account." crumbs={[{ label: "Reviewer", path: "/reviewer" }, { label: "Profile" }]}>
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Technical Reviewer</CardTitle>
              <CardDescription>Subject Matter Expert credentials</CardDescription>
            </div>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <CheckCircle2 className="mr-1 h-3 w-3" /> SME Authorized
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
                <Input defaultValue={user?.department || "Technical Evaluation"} disabled />
              </div>
              <div className="space-y-2">
                <Label>Expertise Area</Label>
                <Input defaultValue="Materials & Engineering" disabled />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

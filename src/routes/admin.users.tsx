import { createFileRoute } from "@tanstack/react-router";
import { Check, Loader2, X, Plus, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/manakx/AppShell";
import { SectionTitle } from "@/components/manakx/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import type { User } from "@/lib/manakx/types";
import { createAdminUser } from "@/lib/auth-server";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [{ title: "User Management — MANAKX Admin" }],
  }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("Technical Reviewer");
  
  // Role-specific fields
  const [newCompany, setNewCompany] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newOrg, setNewOrg] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newEmpId, setNewEmpId] = useState("");

  const fetchUsers = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load users");
    } else if (data) {
      setUsers(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    if (!supabase) return;

    let reason = null;
    if (newStatus === "REJECTED" || newStatus === "SUSPENDED") {
      reason = window.prompt(`Please provide a reason for marking this user as ${newStatus}:`);
      if (reason === null) return; // User cancelled
      if (!reason.trim()) {
        toast.error("A reason is required.");
        return;
      }
    }

    const { data: { session } } = await supabase.auth.getSession();
    const updateData: any = { status: newStatus };
    
    if (newStatus === "ACTIVE") {
      updateData.approved_by = session?.user?.id;
      updateData.approved_at = new Date().toISOString();
    } else if (newStatus === "REJECTED") {
      updateData.rejection_reason = reason;
      updateData.reviewed_by = session?.user?.id;
      updateData.reviewed_at = new Date().toISOString();
    }

    const { error } = await supabase.from("profiles").update(updateData).eq("id", userId);
    
    if (error) {
      toast.error(`Failed to update to ${newStatus}`);
    } else {
      toast.success(`User updated to ${newStatus}`);
      await supabase.from("audit_logs").insert({
        user_id: session?.user?.id,
        action: `Status changed to ${newStatus}${reason ? ` (Reason: ${reason})` : ''}`,
        entity: "User Management",
        entity_id: userId,
      });
      fetchUsers();
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session) throw new Error("No active session");
      
      let metadata: any = {};
      if (newRole === "Vendor/Supplier") {
        metadata = { company_name: newCompany, industry: newIndustry, phone: newPhone };
      } else if (newRole === "Government Procurement Officer") {
        metadata = { organization: newOrg, department: newDept, employee_id: newEmpId };
      }

      await createAdminUser({ data: { 
        token: session.access_token,
        email: newEmail, 
        name: newName, 
        role: newRole as any,
        metadata
      } });
      toast.success("User created successfully", { description: "They can sign in immediately." });
      setIsCreateModalOpen(false);
      setNewName("");
      setNewEmail("");
      setNewRole("Technical Reviewer");
      setNewCompany("");
      setNewIndustry("");
      setNewPhone("");
      setNewOrg("");
      setNewDept("");
      setNewEmpId("");
      fetchUsers();
    } catch (err: any) {
      toast.error("Failed to create user", { description: err.message });
    } finally {
      setCreating(false);
    }
  };

  const pendingOfficers = users.filter((u) => u.status === "PENDING_APPROVAL" && u.role === "Government Procurement Officer");
  const pendingVendors = users.filter((u) => u.status === "PENDING_REVIEW" && u.role === "Vendor/Supplier");
  const allOtherUsers = users.filter((u) => u.status !== "PENDING_APPROVAL" && u.status !== "PENDING_REVIEW");

  return (
    <AppShell
      title="User Management"
      description="Manage accounts, approve officers, and oversee system access."
      crumbs={[{ label: "Administration", path: "/admin" }, { label: "Users" }]}
    >
      <div className="mb-6 flex items-center justify-between">
        <SectionTitle title="Directory" description="View and manage all system users." />
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" /> Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle>Create Administrator or Reviewer</DialogTitle>
                <DialogDescription>
                  Manually create internal accounts. Users will receive an email to verify their address.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" required value={newName} onChange={(e) => setNewName(e.target.value)} disabled={creating} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} disabled={creating} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newRole} onValueChange={setNewRole} disabled={creating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Government Procurement Officer">Procurement Officer</SelectItem>
                      <SelectItem value="Vendor/Supplier">Vendor / Supplier</SelectItem>
                      <SelectItem value="Technical Reviewer">Technical Reviewer</SelectItem>
                      <SelectItem value="Admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newRole === "Vendor/Supplier" && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="company">Company Name</Label>
                      <Input id="company" required value={newCompany} onChange={(e) => setNewCompany(e.target.value)} disabled={creating} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input id="industry" required value={newIndustry} onChange={(e) => setNewIndustry(e.target.value)} disabled={creating} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" type="tel" required value={newPhone} onChange={(e) => setNewPhone(e.target.value)} disabled={creating} />
                    </div>
                  </>
                )}
                {newRole === "Government Procurement Officer" && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="org">Organization</Label>
                      <Input id="org" required value={newOrg} onChange={(e) => setNewOrg(e.target.value)} disabled={creating} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dept">Department</Label>
                      <Input id="dept" required value={newDept} onChange={(e) => setNewDept(e.target.value)} disabled={creating} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="empid">Employee ID</Label>
                      <Input id="empid" required value={newEmpId} onChange={(e) => setNewEmpId(e.target.value)} disabled={creating} />
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={creating}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create User
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="officers" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="officers">
            Pending Officers 
            {pendingOfficers.length > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {pendingOfficers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="vendors">
            Pending Vendors
            {pendingVendors.length > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {pendingVendors.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Users</TabsTrigger>
        </TabsList>

        <TabsContent value="officers">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : pendingOfficers.length === 0 ? (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No pending officer approvals.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingOfficers.map((u) => (
                <Card key={u.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{u.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </CardHeader>
                  <CardContent>
                    <dl className="mb-4 grid grid-cols-2 gap-2 text-xs">
                      <dt className="text-muted-foreground">Organization:</dt>
                      <dd className="font-medium">{u.organization || "N/A"}</dd>
                      <dt className="text-muted-foreground">Department:</dt>
                      <dd className="font-medium">{u.department || "N/A"}</dd>
                      <dt className="text-muted-foreground">Emp ID:</dt>
                      <dd className="font-medium">{u.employee_id || "N/A"}</dd>
                    </dl>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleStatusChange(u.id, "ACTIVE")} className="flex-1">
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleStatusChange(u.id, "REJECTED")} className="flex-1">
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="vendors">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : pendingVendors.length === 0 ? (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No pending vendor reviews.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingVendors.map((u) => (
                <Card key={u.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{u.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </CardHeader>
                  <CardContent>
                    <dl className="mb-4 grid grid-cols-2 gap-2 text-xs">
                      <dt className="text-muted-foreground">Company:</dt>
                      <dd className="font-medium">{u.company_name || "N/A"}</dd>
                      <dt className="text-muted-foreground">Industry:</dt>
                      <dd className="font-medium">{u.industry || "N/A"}</dd>
                      <dt className="text-muted-foreground">Phone:</dt>
                      <dd className="font-medium">{u.phone || "N/A"}</dd>
                    </dl>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleStatusChange(u.id, "ACTIVE")} className="flex-1 bg-green-600 hover:bg-green-700">
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleStatusChange(u.id, "REJECTED")} className="flex-1">
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Email</th>
                    <th className="p-3 font-medium">Role</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allOtherUsers.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-muted/50">
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3 text-muted-foreground">{u.email}</td>
                      <td className="p-3">{u.role}</td>
                      <td className="p-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                          u.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : u.status === 'SUSPENDED' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {u.status === "ACTIVE" ? (
                          <Button variant="outline" size="sm" onClick={() => handleStatusChange(u.id, "SUSPENDED")}>Suspend</Button>
                        ) : u.status === "SUSPENDED" ? (
                          <Button variant="outline" size="sm" onClick={() => handleStatusChange(u.id, "ACTIVE")}>Reactivate</Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {allOtherUsers.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

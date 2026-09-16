import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, Loader2, UserPlus, Package, Building2, UserRound, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/manakx/AppShell";
import { DisclaimerBar } from "@/components/manakx/bits";
import { hydrate } from "@/lib/manakx/store";
import { signUp } from "@/lib/auth";
import type { Role } from "@/lib/manakx/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Account — MANAKX" },
    ],
  }),
  component: SignupPage,
});

type SignupPath = "Officer" | "Vendor" | null;

function SignupPage() {
  const navigate = useNavigate();
  const [path, setPath] = useState<SignupPath>(null);

  // Common
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Officer fields
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [department, setDepartment] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  // Vendor fields
  const [contactPerson, setContactPerson] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    hydrate();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (path === "Officer") {
        await signUp(
          email.trim(),
          password,
          name.trim(),
          "Government Procurement Officer",
          {
            organization: organization.trim(),
            department: department.trim(),
            employee_id: employeeId.trim(),
          }
        );
        toast.success("Account submitted", {
          description: "Your Procurement Officer account has been submitted for Admin approval.",
          duration: 8000,
        });
      } else if (path === "Vendor") {
        await signUp(
          email.trim(),
          password,
          contactPerson.trim(),
          "Vendor/Supplier",
          {
            company_name: companyName.trim(),
            industry: industry.trim(),
            phone: phone.trim(),
          }
        );
        toast.success("Account created", {
          description: "You can now sign in with your credentials.",
          duration: 4000,
        });
      }
      navigate({ to: "/login" });
    } catch (err: any) {
      const message = err?.message || "Signup failed";
      if (message.includes("already registered")) {
        toast.error("Email already registered", { description: "Try signing in instead." });
      } else {
        toast.error("Signup error", { description: message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel */}
      <div className="relative hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="surface-grid absolute inset-0 opacity-20" />
        <Link to="/" className="relative">
          <Logo />
        </Link>
        <div className="relative">
          <h2 className="font-display text-3xl font-semibold leading-snug">
            Join MANAKX — AI-powered standards intelligence.
          </h2>
          <p className="mt-3 max-w-md text-sm text-sidebar-foreground/70">
            Create procurements, upload specifications, run AI recommendations, or check your products against active tenders.
          </p>
        </div>
        <p className="relative text-xs text-sidebar-foreground/60">
          MANAKX: Advanced AI Procurement Intelligence
        </p>
      </div>

      {/* Right panel — signup form */}
      <div className="flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Logo />
          </div>

          {!path ? (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-4">
              <h1 className="font-display text-2xl font-semibold">Create your account</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose how you will use MANAKX.
              </p>

              <div className="mt-6 space-y-4">
                <button
                  type="button"
                  onClick={() => setPath("Officer")}
                  className="group flex w-full flex-col items-start gap-2 rounded-xl border p-5 text-left transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold">
                      <Building2 className="h-5 w-5 text-primary" />
                      Procurement Officer
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <span className="block text-sm text-muted-foreground">
                    Create procurement analyses, upload specifications, and run AI standards recommendations.
                  </span>
                  <span className="mt-2 inline-flex items-center rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    Requires Administrator approval
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPath("Vendor")}
                  className="group flex w-full flex-col items-start gap-2 rounded-xl border p-5 text-left transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold">
                      <Package className="h-5 w-5 text-primary" />
                      Vendor / Supplier
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <span className="block text-sm text-muted-foreground">
                    Check your product datasheets against procurement requirements using AI-assisted pre-bid assessment.
                  </span>
                  <span className="mt-2 inline-flex items-center rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Self-registration available
                  </span>
                </button>
              </div>

              <div className="mt-8 rounded-lg bg-muted/50 p-4 text-center text-sm">
                <p className="font-medium">Are you a Technical Reviewer or Administrator?</p>
                <p className="text-muted-foreground mt-1">Please contact your MANAKX Administrator for account creation.</p>
              </div>
            </div>
          ) : (
            <div className="mt-6 animate-in slide-in-from-right-8">
              <button
                type="button"
                onClick={() => setPath(null)}
                className="mb-4 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to roles
              </button>

              <h1 className="font-display text-2xl font-semibold">
                {path === "Officer" ? "Procurement Officer Registration" : "Vendor Registration"}
              </h1>
              
              <form onSubmit={handleSignup} className="mt-6 space-y-4">
                {path === "Officer" && (
                  <>
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1" disabled={loading} />
                    </div>
                    <div>
                      <Label htmlFor="email">Official Email</Label>
                      <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" disabled={loading} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="org">Organization</Label>
                        <Input id="org" required value={organization} onChange={(e) => setOrganization(e.target.value)} className="mt-1" disabled={loading} />
                      </div>
                      <div>
                        <Label htmlFor="dept">Department Name</Label>
                        <Input id="dept" required value={department} onChange={(e) => setDepartment(e.target.value)} className="mt-1" disabled={loading} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="empid">Employee / Reference ID</Label>
                      <Input id="empid" required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="mt-1" disabled={loading} />
                    </div>
                  </>
                )}

                {path === "Vendor" && (
                  <>
                    <div>
                      <Label htmlFor="cperson">Contact Person</Label>
                      <Input id="cperson" required value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="mt-1" disabled={loading} />
                    </div>
                    <div>
                      <Label htmlFor="email">Business Email</Label>
                      <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" disabled={loading} />
                    </div>
                    <div>
                      <Label htmlFor="cname">Company Name</Label>
                      <Input id="cname" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1" disabled={loading} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Input id="industry" required value={industry} onChange={(e) => setIndustry(e.target.value)} className="mt-1" disabled={loading} />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" disabled={loading} />
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="password"
                        required
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cpassword">Confirm Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="cpassword"
                        required
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="mt-2 w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Submit Registration
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </div>
          
          <Card className="mt-6 border-dashed">
            <CardContent className="p-4">
              <DisclaimerBar />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

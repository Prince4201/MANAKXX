import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, Loader2, UserPlus, ShieldCheck, UserRound, UserCog, Package } from "lucide-react";
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
      { title: "Create Account — MANAKX Standards Intelligence" },
      { name: "description", content: "Create your MANAKX account to access procurement standards recommendations." },
      { property: "og:title", content: "Sign Up — MANAKX" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignupPage,
});

const ROLES: { role: Role; icon: typeof UserRound; label: string; blurb: string; needsApproval: boolean }[] = [
  {
    role: "Government Procurement Officer",
    icon: UserRound,
    label: "Procurement Officer",
    blurb: "Create procurement analyses, upload tender specs, run AI recommendations.",
    needsApproval: false,
  },
  {
    role: "Technical Reviewer",
    icon: ShieldCheck,
    label: "Technical Reviewer",
    blurb: "Review and approve/reject AI recommendations for compliance.",
    needsApproval: true,
  },
  {
    role: "Vendor/Supplier",
    icon: Package,
    label: "Vendor / Supplier",
    blurb: "Check your product datasheets against tender requirements (pre-bid assessment).",
    needsApproval: false,
  },
  {
    role: "Admin",
    icon: UserCog,
    label: "Administrator",
    blurb: "Manage users, standards database, scoring weights and audit logs.",
    needsApproval: true,
  },
];

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("Government Procurement Officer");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hydrate();
  }, []);

  const currentRole = ROLES.find((r) => r.role === selectedRole)!;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim(), selectedRole);

      if (currentRole.needsApproval) {
        toast.success("Account created!", {
          description: `Your ${currentRole.label} account requires admin approval before you can sign in.`,
          duration: 6000,
        });
      } else {
        toast.success("Account created!", {
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
            Whether you're a procurement officer, reviewer, vendor, or admin — get started in under a minute.
          </p>
        </div>
        <p className="relative text-xs text-sidebar-foreground/60">
          MANAKX — AI Standards Recommendation for Procurement
        </p>
      </div>

      {/* Right panel — signup form */}
      <div className="flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-6 font-display text-2xl font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose your role and set up your credentials.
          </p>

          {/* Role selector */}
          <div className="mt-5 space-y-2">
            {ROLES.map((r) => (
              <button
                key={r.role}
                type="button"
                onClick={() => setSelectedRole(r.role)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                  selectedRole === r.role ? "border-primary bg-primary/5" : "hover:bg-muted/60",
                )}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <r.icon className="h-4.5 w-4.5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{r.label}</span>
                  <span className="block text-xs text-muted-foreground">{r.blurb}</span>
                </span>
                {r.needsApproval && (
                  <span className="mt-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Needs approval
                  </span>
                )}
              </button>
            ))}
          </div>

          <form onSubmit={handleSignup} className="mt-5 space-y-3">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
                autoComplete="name"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create account
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
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

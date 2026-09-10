import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/manakx/AppShell";
import { DisclaimerBar } from "@/components/manakx/bits";
import { actions, hydrate } from "@/lib/manakx/store";
import { signIn, getProfile } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — MANAKX Standards Intelligence" },
      { name: "description", content: "Sign in to the MANAKX procurement standards recommendation platform." },
      { property: "og:title", content: "Sign in — MANAKX" },
      { property: "og:description", content: "Sign in for procurement officers, reviewers, vendors and administrators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hydrate();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const { session } = await signIn(email.trim(), password);

      if (!session?.user) {
        toast.error("Login failed", { description: "No session returned." });
        return;
      }

      // Fetch the user profile from profiles table
      const profile = await getProfile(session.user.id);

      if (!profile) {
        toast.error("Profile not found", { description: "Your profile could not be loaded. Contact an admin." });
        return;
      }

      if (!profile.approved) {
        toast.warning("Account pending approval", {
          description: "Your account is awaiting admin approval. Please try again later.",
        });
        return;
      }

      // Set user in local store
      actions.login(profile);
      toast.success(`Welcome back, ${profile.name}`, {
        description: `Signed in as ${profile.role}`,
      });
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      const message = err?.message || "Login failed";
      if (message.includes("Invalid login credentials")) {
        toast.error("Invalid credentials", { description: "Check your email and password." });
      } else if (message.includes("Email not confirmed")) {
        toast.error("Email not verified", { description: "Please check your inbox and verify your email first." });
      } else {
        toast.error("Login error", { description: message });
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
            From procurement specifications to standards intelligence.
          </h2>
          <p className="mt-3 max-w-md text-sm text-sidebar-foreground/70">
            Requirement extraction, semantic matching, gap and conflict detection, human review and reporting — powered
            by AI and backed by a real database.
          </p>
        </div>
        <p className="relative text-xs text-sidebar-foreground/60">
          MANAKX — AI Standards Recommendation for Procurement
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-6 font-display text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your credentials to access MANAKX.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Create one
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/manakx/AppShell";
import { signOut } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/account-suspended")({
  component: AccountSuspendedPage,
});

function AccountSuspendedPage() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="absolute top-8">
        <Logo />
      </div>
      <div className="w-full max-w-md text-center animate-in fade-in slide-in-from-bottom-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold">Account Suspended</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Your account has been temporarily suspended by an Administrator. Please contact support to resolve this issue and restore your access.
        </p>
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}

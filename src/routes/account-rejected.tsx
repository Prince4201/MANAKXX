import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/manakx/AppShell";
import { signOut } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/account-rejected")({
  component: AccountRejectedPage,
});

function AccountRejectedPage() {
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
          <XCircle className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold">Account Rejected</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Unfortunately, your account application has been rejected by an Administrator. If you believe this is a mistake, please contact support or your organization administrator.
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

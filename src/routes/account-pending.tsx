import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/manakx/AppShell";
import { signOut } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/account-pending")({
  component: AccountPendingPage,
});

function AccountPendingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold">Account Pending Approval</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {user?.status === "PENDING_REVIEW"
            ? "Your vendor registration has been received and is currently under review. You will be notified once a Technical Reviewer approves your account."
            : "Your account request has been received and is waiting for Administrator approval. We will notify you once it has been processed."}
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

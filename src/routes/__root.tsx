import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" },
      { title: "MANAKX — AI Standards Recommendation for Procurement" },
      {
        name: "description",
        content:
          "MANAKX recommends applicable Indian Standards for procurement specifications. Prototype with synthetic data.",
      },
      { name: "author", content: "MANAKX" },
      { property: "og:title", content: "MANAKX — AI Standards Recommendation for Procurement" },
      {
        property: "og:description",
        content: "Requirement extraction, standards matching, gap and conflict detection, human review and reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { useAuth } from "@/lib/auth";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    
    return () => {
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("touchstart", handleTouchStart);
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const path = location.pathname;
    const isAuthRoute = path === "/login" || path === "/signup" || path === "/";
    
    // Not authenticated, trying to access a protected route
    if (!user && !isAuthRoute) {
      navigate({ to: "/login", replace: true });
      return;
    }

    // Authenticated, trying to access login/signup
    if (user && (path === "/login" || path === "/signup")) {
      if (user.role === "Admin") navigate({ to: "/admin", replace: true });
      else if (user.role === "Technical Reviewer") navigate({ to: "/reviewer", replace: true });
      else if (user.role === "Vendor/Supplier") navigate({ to: "/vendor", replace: true });
      else navigate({ to: "/dashboard", replace: true });
      return;
    }

    // Strict Role-based access control
    if (user) {
      if (user.status !== "ACTIVE") {
        const allowedPaths = ["/account-pending", "/account-rejected", "/account-suspended"];
        if (!allowedPaths.includes(path) && path !== "/login" && path !== "/signup" && path !== "/") {
          if (user.status === "PENDING_APPROVAL" || user.status === "PENDING_REVIEW") {
            navigate({ to: "/account-pending", replace: true });
          } else if (user.status === "REJECTED") {
            navigate({ to: "/account-rejected", replace: true });
          } else if (user.status === "SUSPENDED") {
            navigate({ to: "/account-suspended", replace: true });
          }
          return;
        }
      }

      const deny = (msg: string) => {
        const home = user.role === "Admin" ? "/admin"
          : user.role === "Technical Reviewer" ? "/reviewer"
          : user.role === "Vendor/Supplier" ? "/vendor"
          : "/dashboard";
        navigate({ to: home, replace: true });
        toast.error("Access Denied", { description: msg });
      };

      // Admin routes
      if (path.startsWith("/admin") && user.role !== "Admin") {
        deny("You do not have Administrator privileges.");
      }
      // Reviewer routes
      else if (path.startsWith("/reviewer") && !["Technical Reviewer", "Admin"].includes(user.role)) {
        deny("You are not a Technical Reviewer.");
      }
      // Vendor routes
      else if (path.startsWith("/vendor") && user.role !== "Vendor/Supplier") {
        deny("You are not a Vendor/Supplier.");
      }
      // Officer routes (dashboard, analysis, officer/*)
      else if (
        (path.startsWith("/dashboard") || path.startsWith("/analysis") || path.startsWith("/officer")) &&
        !["Government Procurement Officer", "Admin"].includes(user.role)
      ) {
        deny("You do not have Procurement Officer privileges.");
      }
    }
  }, [user, loading, location.pathname, navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      {loading ? (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Outlet />
      )}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

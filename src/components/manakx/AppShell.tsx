import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Database,
  FileSearch,
  FileText,
  GitCompare,
  History,
  LayoutDashboard,
  LogOut,
  Moon,
  PlusCircle,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  UserCog,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { actions, hydrate, useStore } from "@/lib/manakx/store";
import { cn } from "@/lib/utils";
import { DisclaimerBar } from "./bits";

const NAV = [
  { section: "Workspace", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/analysis/new", label: "New Analysis", icon: PlusCircle },
    { to: "/history", label: "Analysis History", icon: History },
    { to: "/compare", label: "Compare Standards", icon: GitCompare },
  ]},
  { section: "Knowledge", items: [
    { to: "/standards", label: "Standards Search", icon: Search },
    { to: "/review", label: "Human Review", icon: ShieldCheck },
    { to: "/reports", label: "Reports", icon: FileText },
  ]},
  { section: "Administration", items: [
    { to: "/admin", label: "Admin Dashboard", icon: UserCog },
    { to: "/admin/standards", label: "Standards Database", icon: Database },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/settings", label: "Profile & Settings", icon: Settings },
  ]},
] as const;

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-md bg-accent font-display text-[11px] font-bold text-accent-foreground shadow-sm">
        <span className="absolute inset-x-0 top-0 h-0.5 bg-success" />
        M<span className="opacity-70">X</span>
      </span>
      {!compact && (
        <div className="leading-tight">
          <p className="font-display text-base font-semibold">MANAKX</p>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Standards Intelligence</p>
        </div>
      )}
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useStore();
  return (
    <ScrollArea className="h-full">
      <nav className="space-y-5 p-3">
        {NAV.map((group) => {
          if (group.section === "Administration" && user?.role !== "Administrator") {
            return (
              <div key={group.section} className="space-y-1">
                <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  Account
                </p>
                <NavItem to="/settings" label="Profile & Settings" icon={Settings} pathname={pathname} onNavigate={onNavigate} />
              </div>
            );
          }
          return (
            <div key={group.section} className="space-y-1">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {group.section}
              </p>
              {group.items.map((item) => (
                <NavItem key={item.to} {...item} pathname={pathname} onNavigate={onNavigate} />
              ))}
            </div>
          );
        })}
      </nav>
    </ScrollArea>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  pathname,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  pathname: string;
  onNavigate?: (() => void) | undefined;
}) {
  const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(`${to}/`));
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

export interface Crumb {
  label: string;
  to?: string;
}

export function AppShell({
  children,
  title,
  description,
  crumbs = [],
  actions: pageActions,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
}) {
  const { user, theme } = useStore();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || user) return;
    const t = setTimeout(() => {
      void navigate({ to: "/login", search: {}, replace: true });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5 text-sidebar-foreground">
          <Link to="/dashboard">
            <Logo />
          </Link>
        </div>
        <div className="min-h-0 flex-1">
          <NavList />
        </div>
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-md border border-sidebar-border bg-sidebar-accent/50 p-3 text-[10px] leading-relaxed text-sidebar-foreground/65">
            <p className="mb-1 font-semibold uppercase tracking-wider text-sidebar-primary">SIH 2026 · SIH26108</p>
            Synthetic prototype data — not official BIS guidance.
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur-xl lg:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden">
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground">
              <div className="flex h-14 items-center border-b border-sidebar-border px-4">
                <Logo />
              </div>
              <NavList />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <nav className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Link to="/dashboard" className="hover:text-foreground">
                MANAKX
              </Link>
              {crumbs.map((c) => (
                <span key={c.label} className="flex items-center gap-1">
                  <span>/</span>
                  {c.to ? (
                    <Link to={c.to} className="hover:text-foreground">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-foreground">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
          </div>

          <Button variant="ghost" size="icon" onClick={() => actions.toggleTheme()} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link to="/analysis/new">
              <PlusCircle className="mr-1.5 h-4 w-4" /> New Analysis
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {(user?.name ?? "DU").slice(0, 2).toUpperCase()}
                </span>
                <span className="hidden text-left text-xs leading-tight md:block">
                  <span className="block font-medium">{user?.name ?? "Demo User"}</span>
                  <span className="block text-muted-foreground">{user?.role ?? "Procurement Officer"}</span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>{user?.email ?? "demo@manakx.in"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" /> Profile & Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/standards">
                  <FileSearch className="mr-2 h-4 w-4" /> Standards Search
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  actions.logout();
                  navigate({ to: "/login" });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-7 lg:px-8 lg:py-9">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-semibold lg:text-[1.75rem]">{title}</h1>
              {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
            </div>
            {pageActions ? <div className="flex flex-wrap gap-2">{pageActions}</div> : null}
          </div>
          <DisclaimerBar className="no-print mb-5" />
          {children}
        </main>
      </div>
    </div>
  );
}


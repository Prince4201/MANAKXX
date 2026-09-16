import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  ClipboardCheck,
  Database,
  FileSearch,
  FileText,
  FolderOpen,
  GitCompare,
  History,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Moon,
  Package,
  PlusCircle,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Upload,
  User,
  UserCog,
  Users,
  Award,
  Zap,
  type LucideIcon,
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
import type { Role } from "@/lib/manakx/types";

/* ------------------------------------------------------------------ */
/*  Role-specific navigation definitions                               */
/* ------------------------------------------------------------------ */

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

const OFFICER_NAV: NavSection[] = [
  {
    section: "Workspace",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/officer/procurements", label: "My Procurements", icon: FolderOpen },
      { to: "/analysis/new", label: "New Procurement", icon: PlusCircle },
    ],
  },
  {
    section: "Analysis",
    items: [
      { to: "/history", label: "Analysis History", icon: History },
      { to: "/standards", label: "Standards Search", icon: Search },
      { to: "/compare", label: "Compare Standards", icon: GitCompare },
    ],
  },
  {
    section: "Vendor Management",
    items: [
      { to: "/officer/vendors", label: "Vendor Applications", icon: Users },
      { to: "/officer/evaluation", label: "Tender Award", icon: Award },
    ],
  },
  {
    section: "Review & Reports",
    items: [
      { to: "/review", label: "Review Status", icon: ShieldCheck },
      { to: "/reports", label: "Reports", icon: FileText },
      { to: "/officer/inspection", label: "Product Inspection", icon: ClipboardCheck },
    ],
  },
  {
    section: "Account",
    items: [
      { to: "/settings", label: "Profile & Settings", icon: Settings },
    ],
  },
];

const REVIEWER_NAV: NavSection[] = [
  {
    section: "Review",
    items: [
      { to: "/reviewer", label: "Dashboard", icon: LayoutDashboard },
      { to: "/reviewer/queue", label: "Review Queue", icon: ListChecks },
      { to: "/reviewer/history", label: "Review History", icon: History },
    ],
  },
  {
    section: "Reference",
    items: [
      { to: "/standards", label: "Standards Search", icon: Search },
      { to: "/reports", label: "Reports", icon: FileText },
    ],
  },
  {
    section: "Account",
    items: [
      { to: "/reviewer/profile", label: "Profile", icon: User },
    ],
  },
];

const VENDOR_NAV: NavSection[] = [
  {
    section: "Workspace",
    items: [
      { to: "/vendor", label: "Dashboard", icon: LayoutDashboard },
      { to: "/vendor/procurements", label: "Available Procurements", icon: Briefcase },
      { to: "/vendor/products", label: "My Products", icon: Package },
    ],
  },
  {
    section: "Assessment",
    items: [
      { to: "/vendor/assessments", label: "Self-Assessments", icon: ClipboardCheck },
      { to: "/vendor/documents", label: "Documents", icon: Upload },
      { to: "/vendor/history", label: "Assessment History", icon: History },
    ],
  },
  {
    section: "Account",
    items: [
      { to: "/vendor/profile", label: "Profile", icon: User },
    ],
  },
];

const ADMIN_NAV: NavSection[] = [
  {
    section: "Administration",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/users", label: "User Management", icon: Users },
    ],
  },
  {
    section: "System",
    items: [
      { to: "/admin/standards", label: "Standards Database", icon: Database },
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/admin/audit", label: "Audit Logs", icon: BookOpen },
      { to: "/settings", label: "AI Configuration", icon: Settings },
    ],
  },
  {
    section: "Account",
    items: [
      { to: "/admin/profile", label: "Profile", icon: User },
    ],
  },
];

function getNavForRole(role?: Role): NavSection[] {
  switch (role) {
    case "Government Procurement Officer":
      return OFFICER_NAV;
    case "Technical Reviewer":
      return REVIEWER_NAV;
    case "Vendor/Supplier":
      return VENDOR_NAV;
    case "Admin":
      return ADMIN_NAV;
    default:
      return OFFICER_NAV;
  }
}

function getRoleLabel(role?: Role): string {
  switch (role) {
    case "Government Procurement Officer":
      return "Procurement Officer";
    case "Technical Reviewer":
      return "Technical Reviewer";
    case "Vendor/Supplier":
      return "Vendor / Supplier";
    case "Admin":
      return "Administrator";
    default:
      return "User";
  }
}

function getRoleBadgeColor(role?: Role): string {
  switch (role) {
    case "Government Procurement Officer":
      return "bg-gradient-to-r from-blue-500/15 to-indigo-500/15 text-blue-700 border border-blue-200/50 dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-300 dark:border-blue-800/40";
    case "Technical Reviewer":
      return "bg-gradient-to-r from-purple-500/15 to-pink-500/15 text-purple-700 border border-purple-200/50 dark:from-purple-500/20 dark:to-pink-500/20 dark:text-purple-300 dark:border-purple-800/40";
    case "Vendor/Supplier":
      return "bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-700 border border-emerald-200/50 dark:from-emerald-500/20 dark:to-teal-500/20 dark:text-emerald-300 dark:border-emerald-800/40";
    case "Admin":
      return "bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-700 border border-amber-200/50 dark:from-amber-500/20 dark:to-orange-500/20 dark:text-amber-300 dark:border-amber-800/40";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
  }
}

function getHomeRoute(role?: Role): string {
  switch (role) {
    case "Government Procurement Officer":
      return "/dashboard";
    case "Technical Reviewer":
      return "/reviewer";
    case "Vendor/Supplier":
      return "/vendor";
    case "Admin":
      return "/admin";
    default:
      return "/dashboard";
  }
}

interface QuickAction {
  to: string;
  label: string;
  icon: LucideIcon;
}

function getQuickAction(role?: Role): QuickAction | null {
  switch (role) {
    case "Government Procurement Officer":
      return { to: "/analysis/new", label: "New Procurement", icon: PlusCircle };
    case "Technical Reviewer":
      return { to: "/reviewer/queue", label: "Review Queue", icon: ListChecks };
    case "Vendor/Supplier":
      return { to: "/vendor/procurements", label: "Start Assessment", icon: ClipboardCheck };
    case "Admin":
      return { to: "/admin/users", label: "Manage Users", icon: Users };
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="group flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[12px] shadow-lg shadow-blue-500/25 ring-1 ring-inset ring-white/20 transition-transform duration-300 group-hover:scale-105">
        <img src="/favicon.jpg" alt="MANAKX Logo" className="h-full w-full object-cover" />
      </div>
      {!compact && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-2">
            <p className="font-display text-[19px] font-bold tracking-tight">
              MANAK<span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm transition-all duration-500 group-hover:from-indigo-300 group-hover:to-cyan-300">X</span>
            </p>
            {/* <span className="inline-flex items-center rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)] transition-all duration-500 group-hover:bg-indigo-500/20 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]">Sih6</span> */}
          </div>
          <p className="mt-1 text-[10.5px] font-medium tracking-wide opacity-50 transition-opacity duration-300 group-hover:opacity-90">AI Standards & Compliance Intelligence</p>
        </div>
      )}
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useStore();
  const nav = getNavForRole(user?.role);

  return (
    <ScrollArea className="h-full">
      <nav className="space-y-5 p-3">
        {nav.map((group) => (
          <div key={group.section} className="space-y-1">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {group.section}
            </p>
            {group.items.map((item) => (
              <NavItemComponent key={item.to} {...item} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </nav>
    </ScrollArea>
  );
}

function NavItemComponent({
  to,
  label,
  icon: Icon,
  pathname,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  pathname: string;
  onNavigate?: (() => void) | undefined;
}) {
  const active = pathname === to || (to !== "/dashboard" && to !== "/reviewer" && to !== "/vendor" && to !== "/admin" && pathname.startsWith(`${to}/`));
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
  path?: string;
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
  const homeRoute = getHomeRoute(user?.role);
  const quickAction = getQuickAction(user?.role);

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
          <Link to={homeRoute}>
            <Logo />
          </Link>
        </div>

        {/* Role badge */}
        {user && (
          <div className="border-b border-sidebar-border px-4 py-3">
            <p className="text-xs font-medium text-sidebar-foreground/70">{user.name}</p>
            <span className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold", getRoleBadgeColor(user.role))}>
              {getRoleLabel(user.role)}
            </span>
          </div>
        )}

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
              {user && (
                <div className="border-b border-sidebar-border px-4 py-3">
                  <p className="text-xs font-medium">{user.name}</p>
                  <span className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold", getRoleBadgeColor(user.role))}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>
              )}
              <NavList />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <nav className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Link to={homeRoute} className="hover:text-foreground">
                MANAKX
              </Link>
              {crumbs.map((c) => (
                <span key={c.label} className="flex items-center gap-1">
                  <span>/</span>
                  {c.to || c.path ? (
                    <Link to={(c.to || c.path)!} className="hover:text-foreground">
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

          {quickAction && (
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link to={quickAction.to}>
                <quickAction.icon className="mr-1.5 h-4 w-4" />
                {quickAction.label}
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {(user?.name ?? "DU").slice(0, 2).toUpperCase()}
                </span>
                <span className="hidden text-left text-xs leading-tight md:block">
                  <span className="block font-medium">{user?.name ?? "Demo User"}</span>
                  <span className="block text-muted-foreground">{getRoleLabel(user?.role)}</span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <span>{user?.email ?? "demo@manakx.in"}</span>
                  <span className={cn("inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold", getRoleBadgeColor(user?.role))}>
                    {getRoleLabel(user?.role)}
                  </span>
                </div>
              </DropdownMenuLabel>
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
                onClick={async () => {
                  const { signOut } = await import("@/lib/auth");
                  await signOut();
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

import {
  Cpu,
  Bot,
  Zap,
  Globe,
  Terminal,
  DollarSign,
  LayoutDashboard,
  KanbanSquare,
  Calendar,
  StickyNote,
  Hammer,
  Users,
  HardHat,
  Phone,
  Building2,
  TrendingUp,
  MapPin,
  Wallet,
  Receipt,
  PiggyBank,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  LogOut,
  Hexagon,
  Sparkles,
  ShieldCheck,
  Monitor,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

// ---------------------------------------------------------------------------
// Navigation structure
// ---------------------------------------------------------------------------

const navGroups: NavGroup[] = [
  {
    title: "HIVE",
    items: [
      { icon: Cpu, label: "Command Center", path: "/hive" },
      { icon: Bot, label: "Agents", path: "/hive/agents" },
      { icon: Monitor, label: "Sessions", path: "/hive/sessions" },
      { icon: ShieldCheck, label: "Approvals", path: "/hive/approvals" },
      { icon: Sparkles, label: "Skills", path: "/hive/skills" },
      { icon: Zap, label: "Triggers", path: "/hive/triggers" },
      { icon: Globe, label: "API Explorer", path: "/hive/api-explorer" },
      { icon: Terminal, label: "Console", path: "/hive/console" },
      { icon: DollarSign, label: "Cost & Usage", path: "/hive/cost" },
    ],
  },
  {
    title: "WORKSPACE",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/workspace" },
      { icon: KanbanSquare, label: "Kanban", path: "/workspace/kanban" },
      { icon: Calendar, label: "Calendar", path: "/workspace/calendar" },
      { icon: StickyNote, label: "Notes", path: "/workspace/notes" },
    ],
  },
  {
    title: "SYNERGY",
    items: [
      { icon: Hammer, label: "Overview", path: "/synergy" },
      { icon: Users, label: "Leads", path: "/synergy/leads" },
      { icon: HardHat, label: "Subcontractors", path: "/synergy/subs" },
      { icon: Phone, label: "Voice Calls", path: "/synergy/calls" },
    ],
  },
  {
    title: "REAL ESTATE",
    items: [
      { icon: Building2, label: "Properties", path: "/realestate" },
      { icon: TrendingUp, label: "Deal Analysis", path: "/realestate/deals" },
      { icon: MapPin, label: "Market Data", path: "/realestate/market" },
    ],
  },
  {
    title: "FINANCE",
    items: [
      { icon: Wallet, label: "Accounts", path: "/finance" },
      { icon: Receipt, label: "Transactions", path: "/finance/transactions" },
      { icon: PiggyBank, label: "Planning", path: "/finance/planning" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check whether a pathname belongs to a group (any child route is active). */
function isGroupActive(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => {
    // Exact match or starts-with for nested routes
    if (item.path === "/") {
      return pathname === "/";
    }
    return pathname === item.path || pathname.startsWith(item.path + "/");
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SidebarNavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  return (
    <NavLink
      to={item.path}
      end={
        item.path === "/hive" ||
        item.path === "/workspace" ||
        item.path === "/synergy" ||
        item.path === "/realestate" ||
        item.path === "/finance"
      }
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-indigo-600/20 text-indigo-400"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          collapsed && "justify-center px-2",
        )
      }
      title={collapsed ? item.label : undefined}
    >
      <item.icon size={18} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

function SidebarGroup({
  group,
  collapsed,
  pathname,
}: {
  group: NavGroup;
  collapsed: boolean;
  pathname: string;
}) {
  const active = isGroupActive(group, pathname);
  const [isOpen, setIsOpen] = useState(active);

  // When collapsed, render only the first item's icon as a representative
  if (collapsed) {
    return (
      <div className="space-y-1 px-2">
        {group.items.map((item) => (
          <SidebarNavItem key={item.path} item={item} collapsed />
        ))}
      </div>
    );
  }

  return (
    <Collapsible defaultOpen={active} onOpenChange={setIsOpen} className="px-2">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
        <span>{group.title}</span>
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 space-y-0.5">
        {group.items.map((item) => (
          <SidebarNavItem key={item.path} item={item} collapsed={false} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Main Sidebar
// ---------------------------------------------------------------------------

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;

  // Memoize the group list so we don't re-create on every render
  const groups = useMemo(() => navGroups, []);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-card text-card-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* ── Brand header ─────────────────────────────────── */}
      <div className="flex h-14 items-center justify-between border-b border-border px-3">
        {collapsed ? (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Hexagon size={16} className="text-white" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Hexagon size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Xandus Hive
            </span>
          </div>
        )}

        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={onToggle}
          >
            <Menu size={18} />
          </Button>
        )}
      </div>

      {/* ── Expand toggle when collapsed ─────────────────── */}
      {collapsed && (
        <Button
          variant="ghost"
          size="icon"
          className="mx-auto my-1 h-8 w-8 text-muted-foreground"
          onClick={onToggle}
        >
          <Menu size={18} />
        </Button>
      )}

      {/* ── Scrollable navigation ────────────────────────── */}
      <ScrollArea className="flex-1">
        <nav className="space-y-4 py-3">
          {groups.map((group) => (
            <SidebarGroup
              key={group.title}
              group={group}
              collapsed={collapsed}
              pathname={pathname}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* ── Separator + bottom section ───────────────────── */}
      <Separator />

      {/* Settings link */}
      <div className="px-2 py-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-indigo-600/20 text-indigo-400"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              collapsed && "justify-center px-2",
            )
          }
          title={collapsed ? "Settings" : undefined}
        >
          <Settings size={18} className="shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>

      {/* User / Sign out */}
      <div className="border-t border-border p-3">
        {collapsed ? (
          <button
            onClick={signOut}
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white">
                {user?.full_name?.charAt(0) || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{user?.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

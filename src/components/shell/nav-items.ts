import {
  AudioLines,
  BarChart3,
  BookOpenCheck,
  ClipboardList,
  FileArchive,
  FilePenLine,
  Gauge,
  Home,
  Import,
  LayoutDashboard,
  ListChecks,
  Lock,
  Megaphone,
  Podcast,
  ScrollText,
  Settings,
  ShieldCheck,
  ShieldQuestion,
  UserCog,
} from "lucide-react";

export type ShellNavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  match?: string[];
};

export const publicNavItems: ShellNavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/login", label: "Login", icon: Lock },
];

export const studentNavItems: ShellNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/plan", label: "Plan", icon: ClipboardList },
  {
    href: "/practice/questions",
    label: "Practice",
    icon: ListChecks,
    match: ["/practice", "/review"],
  },
  { href: "/audio", label: "Audio", icon: AudioLines },
  { href: "/essays", label: "Essays", icon: FilePenLine },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export const onboardingNavItems: ShellNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/onboarding", label: "Finish setup", icon: ClipboardList },
];

export const adminNavItems: ShellNavItem[] = [
  { href: "/admin", label: "Overview", icon: ShieldCheck },
  { href: "/admin/questions", label: "Questions", icon: ListChecks },
  { href: "/admin/essays", label: "Essays", icon: FilePenLine },
  { href: "/admin/podcasts", label: "Podcasts", icon: Podcast },
  { href: "/admin/review", label: "Review queue", icon: BookOpenCheck },
  { href: "/admin/reports", label: "Reports", icon: Megaphone },
  { href: "/admin/coverage", label: "Coverage", icon: Gauge },
  { href: "/admin/imports", label: "Imports", icon: Import },
  { href: "/admin/licenses", label: "Licenses", icon: FileArchive },
  { href: "/admin/audit-log", label: "Audit log", icon: ScrollText },
];

export const userMenuItems: ShellNavItem[] = [
  { href: "/settings", label: "Profile", icon: UserCog },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const adminWorkspaceItem: ShellNavItem = {
  href: "/admin",
  label: "Admin",
  icon: ShieldQuestion,
};

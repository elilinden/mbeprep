"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Menu, Search, UserCircle, X } from "lucide-react";
import {
  type ComponentType,
  type KeyboardEvent,
  type SVGProps,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  adminNavItems,
  adminWorkspaceItem,
  onboardingNavItems,
  publicNavItems,
  studentNavItems,
  userMenuItems,
  type ShellNavItem,
} from "@/components/shell/nav-items";
import { cn } from "@/lib/utils";

import { signOutFromShellAction } from "./actions";

type ShellUser = {
  name?: string | null;
  email?: string | null;
};

type GlobalHeaderProps = {
  hasAdminAccess: boolean;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  user: ShellUser | null;
};

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export function GlobalHeader({
  hasAdminAccess,
  isAuthenticated,
  onboardingComplete,
  user,
}: GlobalHeaderProps) {
  const pathname = usePathname();
  const inAdminWorkspace =
    pathname === "/admin" || pathname.startsWith("/admin/");
  const primaryItems = isAuthenticated
    ? onboardingComplete
      ? studentNavItems
      : onboardingNavItems
    : publicNavItems;
  const showPrimaryNav = !inAdminWorkspace;

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          aria-label="MBE Prep home"
          className="flex shrink-0 items-center gap-3 rounded-md text-base font-semibold text-stone-950 outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
          href={isAuthenticated ? "/dashboard" : "/"}
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-md bg-emerald-700 text-sm font-bold text-white"
          >
            M
          </span>
          <span className="hidden whitespace-nowrap sm:inline">MBE Prep</span>
        </Link>

        {showPrimaryNav ? (
          <>
            <nav
              aria-label={
                isAuthenticated
                  ? "Student primary navigation"
                  : "Public navigation"
              }
              className="hidden min-w-0 flex-1 md:block"
            >
              <ul className="flex items-center gap-1">
                {primaryItems.map((item) => (
                  <li key={item.href}>
                    <PrimaryNavLink item={item} pathname={pathname} />
                  </li>
                ))}
              </ul>
            </nav>
            <MobileNavigationDrawer
              buttonLabel="Open primary navigation"
              closeLabel="Close primary navigation"
              items={primaryItems}
              navLabel={
                isAuthenticated
                  ? "Mobile student primary navigation"
                  : "Mobile public navigation"
              }
              title={isAuthenticated ? "Student navigation" : "Navigation"}
            />
          </>
        ) : (
          <div className="min-w-0 flex-1" />
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {hasAdminAccess ? (
            <WorkspaceSwitcher inAdminWorkspace={inAdminWorkspace} />
          ) : null}
          <div className="hidden items-center rounded-md border border-stone-300 bg-stone-50 px-2 text-stone-500 lg:flex">
            <Search aria-hidden="true" className="size-4" />
            <label className="sr-only" htmlFor="global-search-placeholder">
              Global search
            </label>
            <input
              className="h-9 w-44 bg-transparent px-2 text-sm outline-none placeholder:text-stone-500"
              disabled
              id="global-search-placeholder"
              placeholder="Search"
              type="search"
            />
          </div>
          <Link
            className="inline-flex min-h-10 items-center rounded-md px-3 text-sm font-medium text-stone-700 outline-none hover:bg-stone-100 hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
            href="/#help"
          >
            Help
          </Link>
          {isAuthenticated ? <UserMenu user={user} /> : null}
        </div>
      </div>
    </header>
  );
}

export function AdminNavigationShell() {
  const pathname = usePathname();

  return (
    <>
      <aside
        aria-label="Admin workspace navigation"
        className="hidden w-64 shrink-0 lg:block"
      >
        <div className="sticky top-20 rounded-lg border border-stone-200 bg-white p-3">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
            Admin
          </p>
          <nav aria-label="Admin sections">
            <ul className="space-y-1">
              {adminNavItems.map((item) => (
                <li key={item.href}>
                  <AdminNavLink item={item} pathname={pathname} />
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
      <div className="lg:hidden">
        <MobileNavigationDrawer
          buttonLabel="Open admin navigation"
          closeLabel="Close admin navigation"
          items={adminNavItems}
          navLabel="Mobile admin navigation"
          title="Admin navigation"
          variant="admin"
        />
      </div>
    </>
  );
}

function WorkspaceSwitcher({
  inAdminWorkspace,
}: {
  inAdminWorkspace: boolean;
}) {
  return (
    <nav
      aria-label="Workspace switcher"
      className="hidden rounded-md border border-stone-200 bg-stone-50 p-1 sm:flex"
    >
      <Link
        aria-current={!inAdminWorkspace ? "page" : undefined}
        className={workspaceClass(!inAdminWorkspace)}
        href="/dashboard"
      >
        Student
      </Link>
      <Link
        aria-current={inAdminWorkspace ? "page" : undefined}
        className={workspaceClass(inAdminWorkspace)}
        href={adminWorkspaceItem.href as Route}
      >
        Admin
      </Link>
    </nav>
  );
}

function workspaceClass(active: boolean) {
  return cn(
    "inline-flex min-h-8 items-center rounded px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2",
    active
      ? "border border-emerald-700 bg-white text-emerald-900 shadow-sm"
      : "border border-transparent text-stone-600 hover:bg-white hover:text-stone-950",
  );
}

function UserMenu({ user }: { user: ShellUser | null }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onDocumentClick(event: MouseEvent) {
      const target = event.target;
      if (
        target instanceof Node &&
        buttonRef.current?.parentElement?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    }

    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, [open]);

  function closeAndRestoreFocus() {
    setOpen(false);
    window.requestAnimationFrame(() => buttonRef.current?.focus());
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeAndRestoreFocus();
    }
  }

  return (
    <div className="relative" onKeyDown={onKeyDown}>
      <button
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="User menu"
        className="inline-flex size-10 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 outline-none hover:bg-stone-100 hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
        onClick={() => setOpen((value) => !value)}
        ref={buttonRef}
        type="button"
      >
        <UserCircle aria-hidden="true" className="size-5" />
      </button>
      {open ? (
        <div
          className="absolute right-0 mt-2 w-64 rounded-lg border border-stone-200 bg-white p-2 shadow-lg"
          id={menuId}
          role="menu"
        >
          <div className="border-b border-stone-100 px-3 py-2">
            <p className="truncate text-sm font-semibold text-stone-950">
              {user?.name ?? "Signed-in user"}
            </p>
            {user?.email ? (
              <p className="truncate text-xs text-stone-500">{user.email}</p>
            ) : null}
          </div>
          <div className="py-1">
            {userMenuItems.map(({ href, label, icon: Icon }) => (
              <Link
                className="flex min-h-10 items-center gap-2 rounded-md px-3 text-sm text-stone-700 outline-none hover:bg-stone-100 hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                href={href as Route}
                key={label}
                onClick={() => setOpen(false)}
                role="menuitem"
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </Link>
            ))}
            <form action={signOutFromShellAction}>
              <button
                className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm text-stone-700 outline-none hover:bg-stone-100 hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                role="menuitem"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MobileNavigationDrawer({
  buttonLabel,
  closeLabel,
  items,
  navLabel,
  title,
  variant = "primary",
}: {
  buttonLabel: string;
  closeLabel: string;
  items: ShellNavItem[];
  navLabel: string;
  title: string;
  variant?: "primary" | "admin";
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAndRestoreFocus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function closeAndRestoreFocus() {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return (
    <>
      <button
        aria-expanded={open}
        aria-label={buttonLabel}
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 outline-none hover:bg-stone-100 hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2",
          variant === "primary" ? "md:hidden" : "",
        )}
        onClick={() => setOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <Menu aria-hidden="true" className="size-5" />
      </button>
      {open ? (
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/30 motion-reduce:transition-none"
          role="dialog"
        >
          <div className="flex min-h-dvh justify-end">
            <div className="w-full max-w-sm border-l border-stone-200 bg-white p-4 shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <h2
                  className="text-base font-semibold text-stone-950"
                  id={titleId}
                >
                  {title}
                </h2>
                <button
                  aria-label={closeLabel}
                  className="inline-flex size-10 items-center justify-center rounded-md border border-stone-200 text-stone-700 outline-none hover:bg-stone-100 hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                  onClick={closeAndRestoreFocus}
                  type="button"
                >
                  <X aria-hidden="true" className="size-5" />
                </button>
              </div>
              <nav aria-label={navLabel} className="mt-5">
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item.href}>
                      <DrawerNavLink
                        item={item}
                        onNavigate={() => setOpen(false)}
                        pathname={pathname}
                      />
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function PrimaryNavLink({
  item,
  pathname,
}: {
  item: ShellNavItem;
  pathname: string;
}) {
  const active = isActivePath(item, pathname);
  const Icon = item.icon as IconComponent;

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-md border px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2",
        active
          ? "border-emerald-700 bg-emerald-50 text-emerald-950"
          : "border-transparent text-stone-700 hover:bg-stone-100 hover:text-stone-950",
      )}
      href={item.href as Route}
    >
      <Icon aria-hidden="true" className="size-4" />
      {item.label}
    </Link>
  );
}

function AdminNavLink({
  item,
  pathname,
}: {
  item: ShellNavItem;
  pathname: string;
}) {
  const active = isActivePath(item, pathname);
  const Icon = item.icon as IconComponent;

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-10 items-center gap-3 rounded-md border px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2",
        active
          ? "border-emerald-700 bg-emerald-50 text-emerald-950"
          : "border-transparent text-stone-700 hover:bg-stone-100 hover:text-stone-950",
      )}
      href={item.href as Route}
    >
      <Icon aria-hidden="true" className="size-4" />
      {item.label}
    </Link>
  );
}

function DrawerNavLink({
  item,
  onNavigate,
  pathname,
}: {
  item: ShellNavItem;
  onNavigate: () => void;
  pathname: string;
}) {
  const active = isActivePath(item, pathname);
  const Icon = item.icon as IconComponent;

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-md border px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2",
        active
          ? "border-emerald-700 bg-emerald-50 text-emerald-950"
          : "border-transparent text-stone-700 hover:bg-stone-100 hover:text-stone-950",
      )}
      href={item.href as Route}
      onClick={onNavigate}
    >
      <Icon aria-hidden="true" className="size-4" />
      {item.label}
    </Link>
  );
}

function isActivePath(item: ShellNavItem, pathname: string) {
  const matches = item.match ?? [item.href];

  return matches.some((match) =>
    match === "/"
      ? pathname === "/"
      : pathname === match || pathname.startsWith(`${match}/`),
  );
}

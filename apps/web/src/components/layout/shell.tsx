"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMe } from "@/hooks/use-me";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Database,
  Activity,
  ShieldCheck,
  User,
  LogOut,
  ShieldAlert,
  Bell,
  ListOrdered,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const routes = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/events", label: "Log Explorer", icon: ListOrdered },
  { href: "/rules", label: "Detection Rules", icon: ShieldAlert },
  { href: "/data-sources", label: "Data Sources", icon: Database },
  { href: "/system-health", label: "System Health", icon: Activity },
];

const adminRoutes = [
  { href: "/audit", label: "Audit Activity", icon: ShieldCheck },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: user, isLoading } = useMe();

  const isSuperuser = user?.is_superuser || false;
  const navRoutes = isSuperuser ? [...routes, ...adminRoutes] : routes;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 md:flex-row">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-zinc-800 bg-zinc-900 md:flex">
        <div className="flex h-16 items-center border-b border-zinc-800 px-6">
          <ShieldAlert className="mr-2 h-6 w-6 text-primary" />
          <span className="font-bold text-zinc-100">AutoSOC</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navRoutes.map((route) => {
            const isActive = pathname.startsWith(route.href);
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                }`}
              >
                <route.icon className="h-4 w-4" />
                {route.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 md:justify-end">
          <div className="flex items-center md:hidden">
            <ShieldAlert className="mr-2 h-6 w-6 text-primary" />
            <span className="font-bold text-zinc-100">AutoSOC</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 md:flex">
              <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
              <span className="text-xs font-medium text-zinc-400">Environment: Development</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-800 transition-colors">
                  <User className="h-5 w-5 text-zinc-400" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      {isLoading ? (
                        <>
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium leading-none text-zinc-100">{user?.username}</p>
                          <p className="text-xs leading-none text-zinc-500">{user?.email}</p>
                        </>
                      )}
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <Link href="/profile" className="w-full">
                  <DropdownMenuItem className="focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-red-400 focus:bg-red-950 focus:text-red-400 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 text-zinc-100">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

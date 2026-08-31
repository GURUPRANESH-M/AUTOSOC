"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMe } from "@/hooks/use-me";
import { useSystemHealth } from "@/hooks/use-system-health";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ListOrdered,
  Bell,
  ShieldAlert,
  BrainCircuit,
  Shield,
  Database,
  Cpu,
  Braces,
  Activity,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  Settings,
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
  { href: "/events", label: "Log Explorer", icon: ListOrdered },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/incidents", label: "Incidents", icon: ShieldAlert },
  { href: "/predictions", label: "Predictions", icon: BrainCircuit },
  { href: "/detection", label: "Detection", icon: Shield },
  { href: "/data-sources", label: "Data Sources", icon: Database },
  { href: "/agents", label: "Agents", icon: Cpu },
  { href: "/rules", label: "Rules", icon: Braces },
  { href: "/system-health", label: "System Health", icon: Activity },
];

const adminRoutes = [
  { href: "/audit", label: "Audit Activity", icon: ShieldCheck },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: user, isLoading: isUserLoading } = useMe();
  const { data: healthData, isSuccess: isHealthSuccess, isError: isHealthError } = useSystemHealth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isSuperuser = user?.is_superuser || false;
  const navRoutes = isSuperuser ? [...routes, ...adminRoutes] : routes;

  // Determine current page title
  const currentRoute = navRoutes.find(r => pathname.startsWith(r.href));
  const pageTitle = currentRoute ? currentRoute.label : "AutoSOC Page";

  return (
    <div className="flex min-h-screen bg-zinc-950 font-sans text-zinc-100">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-900 bg-zinc-950 md:flex">
        {/* Title logo block */}
        <div className="flex flex-col justify-center h-20 border-b border-zinc-900 px-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-500" />
            <span className="font-mono text-lg font-bold tracking-tight text-zinc-100">AutoSOC</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono tracking-tighter mt-0.5">
            Autonomous Security Operations Center
          </span>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-0.5 p-4 overflow-y-auto">
          {navRoutes.map((route) => {
            const isActive = pathname.startsWith(route.href);
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`flex items-center gap-3 rounded px-3 py-2 text-xs font-mono transition-colors ${
                  isActive
                    ? "bg-indigo-950/40 text-indigo-400 border-l border-indigo-500 pl-2.5"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                <route.icon className="h-4 w-4" />
                {route.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar User Profile Section */}
        <div className="border-t border-zinc-900 p-4 bg-zinc-950/60">
          {isUserLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 bg-zinc-900" />
              <Skeleton className="h-3 w-32 bg-zinc-900" />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0 flex-1">
                <p className="font-mono font-semibold truncate text-zinc-200">{user?.username}</p>
                <p className="font-mono text-[10px] truncate text-zinc-500">{user?.email}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded p-1 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 cursor-pointer outline-hidden">
                  <Settings className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-zinc-950 border-zinc-900 text-xs">
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer focus:bg-zinc-900 focus:text-zinc-100">
                      <User className="mr-2 h-3.5 w-3.5" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator className="bg-zinc-900" />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="text-red-400 cursor-pointer focus:bg-red-950/30 focus:text-red-400"
                  >
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-zinc-900 bg-zinc-950/60 px-6 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 md:hidden"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Current Section Title */}
            <h1 className="hidden md:block text-sm font-mono font-bold tracking-tight text-zinc-200 uppercase">
              {pageTitle}
            </h1>

            <div className="flex items-center md:hidden">
              <Shield className="h-5 w-5 text-indigo-500 mr-2" />
              <span className="font-mono text-sm font-bold tracking-tight text-zinc-100">AutoSOC</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real System Connection Status Indicator */}
            <div className="flex items-center gap-1.5 border border-zinc-900 bg-zinc-950 px-2 py-1 rounded text-[10px] font-mono">
              <span className={`h-1.5 w-1.5 rounded-full ${
                isHealthSuccess 
                  ? "bg-emerald-500" 
                  : isHealthError 
                    ? "bg-red-500" 
                    : "bg-slate-500 animate-pulse"
              }`} />
              <span className="text-zinc-500">API Status:</span>
              <span className={
                isHealthSuccess 
                  ? "text-emerald-500" 
                  : isHealthError 
                    ? "text-red-500" 
                    : "text-slate-500"
              }>
                {isHealthSuccess ? "ONLINE" : isHealthError ? "OFFLINE" : "CHECKING"}
              </span>
            </div>

            {/* Environment Indicator */}
            <div className="hidden sm:inline-flex items-center border border-zinc-900 bg-zinc-950 px-2 py-1 rounded text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">
              DEV ENV
            </div>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded border border-zinc-900 bg-zinc-950 hover:bg-zinc-900 transition-colors cursor-pointer outline-hidden">
                <User className="h-4 w-4 text-zinc-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-zinc-950 border-zinc-900 text-xs">
                <DropdownMenuLabel className="font-normal font-mono text-zinc-500 px-3 py-2">
                  <p className="truncate font-semibold text-zinc-300">{user?.username}</p>
                  <p className="truncate text-[10px] text-zinc-600 mt-0.5">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-900" />
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer focus:bg-zinc-900 focus:text-zinc-100">
                    <User className="mr-2 h-3.5 w-3.5" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-red-400 cursor-pointer focus:bg-red-950/30 focus:text-red-400"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b border-zinc-900 bg-zinc-950 px-4 py-3 space-y-1">
            {navRoutes.map((route) => {
              const isActive = pathname.startsWith(route.href);
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded px-3 py-2 text-xs font-mono transition-colors ${
                    isActive
                      ? "bg-indigo-950/40 text-indigo-400 border-l border-indigo-500 pl-2.5"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <route.icon className="h-4 w-4" />
                  {route.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Page Content Container */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}

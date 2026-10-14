"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  UserCheck,
  Users,
  Shield,
  Radio,
  Award,
  BarChart3,
  FileSpreadsheet,
  History,
  Settings,
  X,
  ExternalLink,
  CircleDot,
} from "lucide-react";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "Tournaments",
    href: "/admin/tournaments",
    icon: Trophy,
    badge: null,
  },
  {
    name: "Organizers",
    href: "/admin/organizers",
    icon: UserCheck,
    badge: null,
  },
  {
    name: "Players",
    href: "/admin/players",
    icon: Users,
    badge: null,
  },
  {
    name: "Teams",
    href: "/admin/teams",
    icon: Shield,
    badge: null,
  },
  {
    name: "Live Auctions",
    href: "/admin/auctions",
    icon: Radio,
    badge: "LIVE",
  },
  {
    name: "Auction Results",
    href: "/admin/results",
    icon: Award,
    badge: null,
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    badge: null,
  },
  {
    name: "Reports & Exports",
    href: "/admin/reports",
    icon: FileSpreadsheet,
    badge: null,
  },
  {
    name: "Activity Logs",
    href: "/admin/activity-logs",
    icon: History,
    badge: null,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    badge: null,
  },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between bg-white">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              SB
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-900 leading-none">
                Sport<span className="text-emerald-600">Bid</span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mt-0.5">
                Super Admin
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Platform Management
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? "text-emerald-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Platform Status Card at bottom */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70">
          <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700">Database Engine</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <CircleDot className="w-2.5 h-2.5 text-emerald-500 animate-ping" />
                MongoDB Live
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>FastAPI Backend</span>
              <span className="font-mono text-slate-600">v1.0.0</span>
            </div>
          </div>

          <Link
            href="/"
            className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 font-medium py-1 transition-colors"
          >
            <span>Public Platform</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </aside>
    </>
  );
}

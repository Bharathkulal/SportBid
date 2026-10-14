"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Bell,
  Search,
  UserCircle,
  LogOut,
  Settings,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface AdminNavbarProps {
  onToggleSidebar: () => void;
}

export function AdminNavbar({ onToggleSidebar }: AdminNavbarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Derive title from pathname
  const getPageTitle = () => {
    if (pathname === "/admin") return "Overview Dashboard";
    if (pathname === "/admin/tournaments") return "Tournament Management";
    if (pathname === "/admin/organizers") return "Organizer Verification";
    if (pathname === "/admin/players") return "Player Directory";
    if (pathname === "/admin/teams") return "Team Franchises";
    if (pathname === "/admin/auctions") return "Live Auction Control";
    if (pathname === "/admin/results") return "Auction Results & Sales";
    if (pathname === "/admin/analytics") return "Platform Analytics";
    if (pathname === "/admin/reports") return "Reports & Data Exports";
    if (pathname === "/admin/activity-logs") return "Audit Activity Logs";
    if (pathname === "/admin/settings") return "System Settings";
    return "Super Admin";
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="text-xs text-slate-400 font-medium hidden sm:flex items-center gap-1.5">
            <span>Admin</span>
            <span>/</span>
            <span className="text-emerald-700 font-semibold">{getPageTitle()}</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Quick Search, Status, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* System Online Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>MongoDB Live</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  System Alerts
                </span>
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Real-time
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">Deterministic Engine Active</p>
                    <p className="text-slate-500 text-[11px]">WebSocket & Motor sync operational</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">Admin Auth Verified</p>
                    <p className="text-slate-500 text-[11px]">Logged in as root super admin</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs ring-1 ring-emerald-300">
              {user?.full_name ? user.full_name[0].toUpperCase() : "A"}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-none">
                {user?.full_name || "Super Admin"}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                SUPER_ADMIN
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.full_name || "Super Admin"}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                  Super Administrator
                </span>
              </div>

              <div className="py-1">
                <Link
                  href="/admin/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Admin Settings</span>
                </Link>
                <Link
                  href="/admin/activity-logs"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Activity Logs</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium text-left"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

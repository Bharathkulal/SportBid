"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Trophy,
  ArrowRight,
  UserCircle,
  LogOut,
  Menu,
  X,
  Gavel,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";

export function Header() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return "/login";
    if (user.role === "PLAYER") return "/dashboard/player";
    if (user.role === "ORGANIZER") return "/dashboard/organizer";
    return "/admin";
  };

  const navLinks = [
    { label: "Tournaments", href: "/tournaments" },
    { label: "Live Auction", href: "/#auction-preview" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Sports", href: "/#sports" },
    { label: "Architecture", href: "/#features" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#080a10]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2.5 group shrink-0"
        >
          <div className="w-9 h-9 rounded-lg bg-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-yellow-500/10 group-hover:bg-yellow-300 transition-colors">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-black tracking-tight text-white uppercase flex items-center">
              Sport<span className="text-yellow-400">Bid</span>
            </span>
            <span className="text-[9px] text-slate-400 font-medium tracking-wider -mt-1 uppercase hidden sm:block">
              Tournament & Auction Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-slate-300">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="hover:text-yellow-400 transition-colors py-1"
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <Link
              href={getDashboardLink()}
              className="text-yellow-400 hover:text-yellow-300 transition-colors font-semibold flex items-center gap-1"
            >
              My Dashboard
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </nav>

        {/* Desktop Auth Controls */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-300 inline-flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <UserCircle className="w-3.5 h-3.5 text-yellow-400" />
                <span className="truncate max-w-[140px]">{user.full_name}</span>
                <span className="text-[10px] text-slate-400 font-mono">({user.role})</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="text-slate-400 hover:text-white"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Register
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Action & Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          {!user && (
            <Link href="/tournaments">
              <span className="text-xs font-semibold text-yellow-400 px-2 py-1 rounded bg-yellow-400/10 border border-yellow-400/20">
                Tournaments
              </span>
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#080a10]/98 px-4 pt-3 pb-6 space-y-4 shadow-2xl backdrop-blur-lg animate-in slide-in-from-top-2 duration-200">
          {/* User info if logged in */}
          {user && (
            <div className="p-3 rounded-xl bg-[#0e131f] border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white truncate max-w-[180px]">
                    {user.full_name}
                  </div>
                  <div className="text-[11px] text-yellow-400 font-mono">{user.role}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {/* Mobile Nav Links */}
          <div className="grid grid-cols-1 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </Link>
            ))}

            {user && (
              <Link
                href={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold text-yellow-400 hover:bg-yellow-400/10 transition-colors"
              >
                <span>Go to My Dashboard</span>
                <ArrowRight className="w-4 h-4 text-yellow-400" />
              </Link>
            )}
          </div>

          {/* Mobile Auth Buttons (Logged Out) */}
          {!user && (
            <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="primary" size="md" className="w-full justify-center">
                  Register as Player / Organizer
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="secondary" size="md" className="w-full justify-center">
                  Sign In to Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#06080d] text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand & Mission */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-yellow-400 text-slate-950 flex items-center justify-center font-black">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="text-lg font-black tracking-tight text-white uppercase">
                Sport<span className="text-yellow-400">Bid</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              The high-performance platform for automated sports registrations, instant PIL matchday poster rendering, and real-time live player auctions.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Platform Sections
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/tournaments" className="hover:text-yellow-400 transition-colors">
                  Active Tournaments
                </Link>
              </li>
              <li>
                <Link href="/#auction-preview" className="hover:text-yellow-400 transition-colors">
                  Live Auction Arena
                </Link>
              </li>
              <li>
                <Link href="/#sports" className="hover:text-yellow-400 transition-colors">
                  Supported Sports
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-yellow-400 transition-colors">
                  Tournament Workflow
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-yellow-400 transition-colors">
                  Architecture & Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Access Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Access Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/register" className="hover:text-yellow-400 transition-colors">
                  Athlete Registration
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-yellow-400 transition-colors">
                  Organizer Dashboard
                </Link>
              </li>
              <li>
                <Link href="/tournaments" className="hover:text-yellow-400 transition-colors">
                  Spectator & Fans
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-yellow-400 transition-colors">
                  Admin Verification Gate
                </Link>
              </li>
            </ul>
          </div>

          {/* Engineering Architecture */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              System Highlights
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                <span>FastAPI + MongoDB Motor</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                <span>Python PIL Poster Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                <span>Real-Time WebSocket Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                <span>Strict RBAC Security</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} SportBid Platform. Production Ready.
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <span>FastAPI Async Engine</span>
            <span>Deterministic Posters</span>
            <span>Live Purse Control</span>
          </div>
        </div>
      </div>
    </footer>
  );
}


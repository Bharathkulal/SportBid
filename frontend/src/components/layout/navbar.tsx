import Link from "next/link";
import { Trophy, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#090a0f]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white uppercase flex items-center gap-1">
              Sport<span className="text-orange-500">Bid</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider -mt-1 uppercase">
              Pro Tournament Platform
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="#sports" className="hover:text-white transition-colors">
            Supported Sports
          </Link>
          <Link href="#features" className="hover:text-white transition-colors">
            Architecture
          </Link>
          <Link href="#posters" className="hover:text-white transition-colors">
            Auto Posters
          </Link>
          <Link href="#auctions" className="hover:text-white transition-colors">
            Player Auctions
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            Sign In
          </Button>
          <Button variant="primary" size="sm">
            Launch Tournament
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#07080c] py-12 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
            SB
          </div>
          <span className="font-semibold text-white tracking-wide">SportBid</span>
          <span className="text-xs text-slate-500">| Phase 0 Foundation</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
          <span>Deterministic Pillow Engine</span>
          <span>FastAPI + MongoDB Motor</span>
          <span>Role-Based Access Control</span>
          <span>Cloudinary Asset CDN</span>
        </div>

        <div className="text-xs text-slate-500">
          &copy; 2026 SportBid Platform. Production Ready Spec.
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tournament } from "@/lib/tournament-types";
import { apiClient } from "@/lib/api";
import {
  Trophy,
  Zap,
  Users,
  FileImage,
  Gavel,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Clock,
  MapPin,
  Calendar,
  Activity,
  Flame,
  Award,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  CircleDot,
} from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Subtle status badge */}
          <div className="inline-flex items-center gap-2 mb-6">
            <Badge variant="yellow" className="gap-1.5 py-1 px-3.5 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              Pro Sports Tournament & Auction Platform
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-[1.15]">
            Elite Sports Tournaments &{" "}
            <span className="text-yellow-400">Live Player Auctions</span>
          </h1>

          {/* Subtext */}
          <p className="mt-5 text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Automate athlete registrations, generate deterministic matchday posters in milliseconds, manage franchise rosters, and run real-time bidding rooms with millimeter-precision purse tracking.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto sm:max-w-none">
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto justify-center">
                Explore Active Tournaments
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto justify-center">
                <Trophy className="w-4 h-4 mr-1.5 text-yellow-400" />
                Organize a Tournament
              </Button>
            </Link>
          </div>

          {/* Highlight Metrics Bar */}
          <div className="mt-12 sm:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            <div className="p-4 sm:p-5 rounded-xl bg-[#0e131f] border border-slate-800 text-center">
              <div className="text-2xl sm:text-3xl font-black text-white">6+</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">
                Sports Disciplines
              </div>
            </div>
            <div className="p-4 sm:p-5 rounded-xl bg-[#0e131f] border border-slate-800 text-center">
              <div className="text-2xl sm:text-3xl font-black text-yellow-400">&lt; 300ms</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">
                Poster Render Time
              </div>
            </div>
            <div className="p-4 sm:p-5 rounded-xl bg-[#0e131f] border border-slate-800 text-center">
              <div className="text-2xl sm:text-3xl font-black text-white">Real-Time</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">
                Live Auction Engine
              </div>
            </div>
            <div className="p-4 sm:p-5 rounded-xl bg-[#0e131f] border border-slate-800 text-center">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">100%</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">
                Verified Rosters
              </div>
            </div>
          </div>
        </div>

        {/* Live Auction Showcase Card (Authentic Hero Visual) */}
        <div id="auction-preview" className="mt-14 sm:mt-20 max-w-4xl mx-auto">
          <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 p-4 sm:p-6 shadow-xl">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-xs font-bold uppercase text-yellow-400 tracking-wider">
                  Live Auction Floor
                </span>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">| LOT #08</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Next Bid In:</span>
                <span className="text-xs font-mono font-bold text-yellow-400 px-2 py-0.5 rounded bg-yellow-400/10 border border-yellow-400/30">
                  00:14s
                </span>
              </div>
            </div>

            {/* Auction Player Spotlight Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
              {/* Athlete Bio */}
              <div className="space-y-2">
                <div className="inline-block px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-yellow-400 uppercase tracking-wider">
                  Volleyball • Setter / Attacker
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                  Arjun M. Rao
                </h3>
                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between max-w-[200px]">
                    <span>Serial ID:</span>
                    <span className="font-mono text-white font-semibold">#VOL-042</span>
                  </div>
                  <div className="flex justify-between max-w-[200px]">
                    <span>Base Price:</span>
                    <span className="font-mono text-white font-semibold">₹10,000</span>
                  </div>
                </div>
              </div>

              {/* Current High Bid */}
              <div className="p-4 rounded-xl bg-[#111724] border border-slate-700/80 text-center">
                <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  Current Highest Bid
                </div>
                <div className="text-3xl sm:text-4xl font-black font-mono text-yellow-400 mt-1">
                  ₹48,500
                </div>
                <div className="text-xs text-slate-300 mt-1.5 font-medium flex items-center justify-center gap-1">
                  Leader: <span className="text-white font-bold">Coastal Strikers</span>
                </div>
              </div>

              {/* Bidding Room Action */}
              <div className="space-y-3">
                <div className="text-xs text-slate-400 flex justify-between items-center">
                  <span>Franchise Purse Cap:</span>
                  <span className="font-mono font-bold text-emerald-400">₹3,51,500</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-yellow-400 h-full rounded-full" style={{ width: "65%" }} />
                </div>
                <Link href="/login" className="block">
                  <Button variant="primary" size="sm" className="w-full justify-center">
                    <Gavel className="w-3.5 h-3.5 mr-1.5" />
                    Join Live Auction Rooms
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturedTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<Tournament[]>("/tournaments/public")
      .then((data) => setTournaments(data || []))
      .catch((err) => {
        console.error("Failed to fetch public tournaments", err);
        setTournaments([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-16 sm:py-20 bg-[#06080d] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <Badge variant="yellow" className="mb-2.5">
              Live Registrations
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              Featured Tournaments
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Browse official tournaments currently open for athlete registration and live bidding.
            </p>
          </div>
          <Link href="/login" className="shrink-0">
            <Button variant="secondary" size="sm" className="w-full sm:w-auto">
              View All Tournaments
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-xl bg-[#0e131f] border border-slate-800 animate-pulse p-6"
              />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-2xl bg-[#0e131f] border border-slate-800 text-center max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase">
              No Published Tournaments Open Right Now
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 mb-6 leading-relaxed">
              New tournament seasons and live auctions are published regularly. Register as an organizer to host your own sporting league or check back soon.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="primary" size="sm" className="w-full sm:w-auto">
                  Host a Tournament
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                  Check Directory
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="rounded-xl bg-[#0e131f] border border-slate-800 p-6 flex flex-col justify-between hover:border-yellow-400/40 transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider px-2 py-0.5 rounded bg-yellow-400/10 border border-yellow-400/20">
                      {t.sport}
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 font-mono">
                      {t.entry_fee > 0 ? `₹${t.entry_fee} Entry` : "Free Entry"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors line-clamp-1 mb-2">
                    {t.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-5 leading-relaxed">
                    {t.description || "Official tournament hosted on SportBid platform."}
                  </p>

                  <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">
                        {t.venue}, {t.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Starts: {new Date(t.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{t.total_registrations || 0} Players Registered</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  <Link href="/login" className="block">
                    <Button variant="primary" size="sm" className="w-full justify-center">
                      Register as Player
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Permanent Athlete Profile",
      desc: "Players build one verified digital sports card with permanent stats, village/role details, and profile photo.",
      icon: Users,
    },
    {
      step: "02",
      title: "Automated PIL Poster Engine",
      desc: "Deterministic Python Pillow templates render broadcast-ready matchday posters and social badges in milliseconds.",
      icon: FileImage,
    },
    {
      step: "03",
      title: "Organizer Verification Gate",
      desc: "Organizers review incoming registrations and auto-generated artwork before approving roster admission.",
      icon: ShieldCheck,
    },
    {
      step: "04",
      title: "Live Player Auction Floor",
      desc: "Franchises join high-intensity bidding rooms with synchronized clocks, real-time purse caps, and team allocations.",
      icon: Gavel,
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="yellow" className="mb-2.5">
            Platform Workflow
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            From Registration To The Auction Block
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            A seamless four-step pipeline engineered for athletes, tournament organizers, and franchise owners.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="p-6 rounded-xl bg-[#0e131f] border border-slate-800 flex flex-col justify-between hover:border-yellow-400/30 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-black text-yellow-400 px-2 py-0.5 rounded bg-yellow-400/10 border border-yellow-400/20">
                      STEP {item.step}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
                      <Icon className="w-4 h-4 text-yellow-400" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function SportsCategories() {
  const sports = [
    {
      name: "Volleyball",
      roles: "Attacker, Setter, Libero, Universal, Blocker",
      badge: "Priority Engine",
      icon: Activity,
    },
    {
      name: "Cricket",
      roles: "Batsman, Fast Bowler, Spin Bowler, All-Rounder, Wicket Keeper",
      badge: "Priority Engine",
      icon: ShieldCheck,
    },
    {
      name: "Football",
      roles: "Forward, Midfielder, Defender, Goalkeeper",
      badge: "Multi-Field",
      icon: Flame,
    },
    {
      name: "Kabaddi",
      roles: "Raider, Left Corner, Right Corner, All-Rounder",
      badge: "High Energy",
      icon: Zap,
    },
    {
      name: "Basketball",
      roles: "Point Guard, Shooting Guard, Small Forward, Center",
      badge: "Court Layout",
      icon: Award,
    },
    {
      name: "Custom Sport",
      roles: "Dynamic Organizer Field Builder for Any Sporting Code",
      badge: "Extensible",
      icon: SlidersHorizontal,
    },
  ];

  return (
    <section id="sports" className="py-16 sm:py-20 bg-[#06080d] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="yellow" className="mb-2.5">
            Multi-Sport Architecture
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            Tailored For Every Sporting Discipline
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Each sport includes specialized role schemas, metric validation, and dedicated poster templates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sports.map((sport) => {
            const Icon = sport.icon;
            return (
              <div
                key={sport.name}
                className="p-6 rounded-xl bg-[#0e131f] border border-slate-800 transition-all duration-200 hover:border-yellow-400/40"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-wide">{sport.name}</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 uppercase">
                    {sport.badge}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mb-5 leading-relaxed font-mono">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
                    Tracked Positions:
                  </span>
                  {sport.roles}
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center text-xs font-semibold text-yellow-400 hover:text-yellow-300 transition-colors group"
                >
                  View Active Tournaments
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function SystemArchitectureOverview() {
  const pillars = [
    {
      icon: Users,
      title: "Permanent Athlete Profiles",
      description:
        "Athletes keep one verified digital card. Registering for tournaments takes one tap, preserving historic stats without duplicate profile data entry.",
    },
    {
      icon: FileImage,
      title: "Deterministic Python PIL Poster Engine",
      description:
        "High-performance rendering generating broadcast-ready matchday posters with athlete cutouts, jersey badges, and tournament sponsors in milliseconds.",
    },
    {
      icon: ShieldCheck,
      title: "Strict Organizer Approval Gate",
      description:
        "No unverified registrations go public. Organizers preview auto-generated posters and bio details before confirming roster and publishing.",
    },
    {
      icon: Gavel,
      title: "Real-Time Player Auction Arena",
      description:
        "Engineered for live bidding with franchise purse control, category rounds, countdown timers, and automated team squad allocations.",
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-20 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="yellow" className="mb-2.5">
            Core Engineering Specs
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            Built For Serious Tournament Organizers
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Engineered with strict ownership boundaries, asynchronous MongoDB queries, and robust API endpoints.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="p-6 sm:p-7 rounded-xl bg-[#0e131f] border border-slate-800 flex gap-4 sm:gap-5 items-start hover:border-yellow-400/30 transition-colors"
              >
                <div className="w-11 h-11 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2">{pillar.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function CallToAction() {
  return (
    <section className="py-16 sm:py-20 bg-[#06080d] border-t border-slate-800/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-8 sm:p-12 rounded-2xl bg-[#0e131f] border border-slate-800 relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <Badge variant="yellow" className="mb-2">
              Ready to Upgrade Your Sports Events?
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
              Launch Your Tournament & Live Auction Today
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Equip your league, college fest, or franchise tournament with professional player registrations, instant matchday posters, and high-stakes live bidding.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto justify-center">
                  Get Started as Organizer
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto justify-center">
                  Browse Active Tournaments
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

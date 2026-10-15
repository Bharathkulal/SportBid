import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Flame,
  FileImage,
  Gavel,
  ShieldCheck,
  CheckCircle2,
  Users,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-24 pb-20 overflow-hidden">
      {/* Background radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-orange-500/15 to-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <Badge variant="orange" className="gap-1.5 py-1 px-3">
            <Sparkles className="w-3 h-3 text-orange-400" />
            Phase 0 Architecture Active
          </Badge>
          <span className="text-xs text-slate-400 font-medium">FastAPI &bull; MongoDB &bull; Next.js</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase max-w-5xl mx-auto leading-[1.08]">
          Elite Tournament Management &{" "}
          <span className="sports-gradient-text">Automated Player Posters</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          From registration to the auction floor. SportBid gives organizers automated sports poster generation,
          seamless player verification, and high-intensity bidding rooms.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              Get Started as Organizer
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link href="/tournaments" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Explore Tournaments
            </Button>
          </Link>
        </div>

        {/* Highlight Metrics */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto border border-slate-800/80 rounded-2xl bg-[#11141c]/60 p-6 backdrop-blur-sm sports-card-glow">
          <div className="text-center p-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-white">6+</div>
            <div className="text-xs text-slate-400 mt-1 uppercase font-medium">Supported Sports</div>
          </div>
          <div className="text-center p-2 border-l border-slate-800">
            <div className="text-2xl sm:text-3xl font-extrabold text-orange-400">&lt; 300ms</div>
            <div className="text-xs text-slate-400 mt-1 uppercase font-medium">Poster Render Time</div>
          </div>
          <div className="text-center p-2 border-l border-slate-800">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">100%</div>
            <div className="text-xs text-slate-400 mt-1 uppercase font-medium">Data Privacy</div>
          </div>
          <div className="text-center p-2 border-l border-slate-800">
            <div className="text-2xl sm:text-3xl font-extrabold text-white">Live</div>
            <div className="text-xs text-slate-400 mt-1 uppercase font-medium">Auction Engine Ready</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SportsCategories() {
  const sports = [
    {
      name: "Volleyball",
      roleAttr: "Attacker, Setter, Libero",
      tag: "Priority Template",
      border: "border-orange-500/30 hover:border-orange-500",
      accent: "text-orange-400",
    },
    {
      name: "Cricket",
      roleAttr: "Batsman, Bowler, All-Rounder, Wicket Keeper",
      tag: "Priority Template",
      border: "border-blue-500/30 hover:border-blue-500",
      accent: "text-blue-400",
    },
    {
      name: "Football",
      roleAttr: "Forward, Midfielder, Defender, Goalkeeper",
      tag: "Multi-Field",
      border: "border-emerald-500/30 hover:border-emerald-500",
      accent: "text-emerald-400",
    },
    {
      name: "Kabaddi",
      roleAttr: "Raider, Corner, Cover, All-Rounder",
      tag: "High Energy",
      border: "border-amber-500/30 hover:border-amber-500",
      accent: "text-amber-400",
    },
    {
      name: "Basketball",
      roleAttr: "Point Guard, Shooting Guard, Center",
      tag: "Dynamic Layout",
      border: "border-purple-500/30 hover:border-purple-500",
      accent: "text-purple-400",
    },
    {
      name: "Custom Sport",
      roleAttr: "Dynamic Schema Builder for Organizer Fields",
      tag: "Extensible",
      border: "border-slate-700 hover:border-slate-500",
      accent: "text-slate-300",
    },
  ];

  return (
    <section id="sports" className="py-20 bg-[#07080c]/80 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="green" className="mb-3">
            Multi-Sport Architecture
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
            Tailored For Every Sporting Discipline
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Each sport features bespoke registration metrics, stat tracking, and dedicated visual poster templates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sports.map((sport) => (
            <div
              key={sport.name}
              className={`p-6 rounded-xl bg-[#11141c] border ${sport.border} transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white tracking-wide">{sport.name}</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 ${sport.accent}`}>
                  {sport.tag}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed font-mono">
                Attributes: {sport.roleAttr}
              </p>
              <div className="flex items-center text-xs font-semibold text-slate-300 hover:text-white cursor-pointer group">
                View Template Details
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SystemArchitectureOverview() {
  const pillars = [
    {
      icon: Users,
      title: "Permanent Profiles & Instant Registration",
      description:
        "Athletes keep one permanent digital card. Registering for tournaments takes one tap, preserving historic stats without duplicate profile data entry.",
    },
    {
      icon: FileImage,
      title: "Automated Python PIL Poster Engine",
      description:
        "Deterministic rendering generating sports-ready matchday posters with athlete cutouts, jersey badges, and tournament sponsors in milliseconds.",
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
    <section id="features" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="orange" className="mb-3">
            Core Platform Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
            Built For Serious Tournament Organizers
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Engineered with strict ownership boundaries, asynchronous MongoDB queries, and robust API endpoints.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="p-8 rounded-2xl bg-[#11141c]/90 border border-slate-800 sports-card-glow flex gap-5 items-start"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{pillar.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{pillar.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

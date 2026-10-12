"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tournament } from "@/lib/tournament-types";
import { apiClient } from "@/lib/api";
import { Trophy, Calendar, MapPin, Users, ArrowRight, Sparkles } from "lucide-react";

export default function TournamentsListPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<Tournament[]>("/tournaments/public")
      .then(setTournaments)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="orange" className="mb-3">
            Active Sporting Events
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight">
            Official <span className="sports-gradient-text">Tournaments</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-400">
            Register now to receive your official matchday player poster and enter the verified player pool.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500 font-medium">
            Loading published tournaments...
          </div>
        ) : tournaments.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#11141c] border border-slate-800 text-center max-w-lg mx-auto">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white uppercase">No Active Tournaments</h3>
            <p className="text-xs text-slate-400 mt-2 mb-6">
              There are no published tournaments open for registration at the moment.
            </p>
            <Link href="/register">
              <Button variant="primary" size="sm">
                Organize A Tournament
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl bg-[#11141c] border border-slate-800/80 p-6 flex flex-col justify-between sports-card-glow hover:border-orange-500/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant={t.sport === "VOLLEYBALL" ? "orange" : "green"}>
                      {t.sport}
                    </Badge>
                    <span className="text-xs font-semibold text-emerald-400">
                      {t.entry_fee > 0 ? `₹${t.entry_fee} Entry` : "Free Entry"}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1 mb-2">
                    {t.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-5 leading-relaxed">
                    {t.description}
                  </p>

                  <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800/60 pt-4">
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
                      <span>{t.total_registrations} Players Registered</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60">
                  <Link href={`/tournament/${t.id}/register`} className="block">
                    <Button variant="primary" size="sm" className="w-full">
                      Register as Player
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

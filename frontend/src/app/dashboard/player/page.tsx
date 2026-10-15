"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { apiClient, getFullStorageUrl } from "@/lib/api";
import { Registration } from "@/lib/tournament-types";
import { PlayerAuctionPoster } from "@/components/poster/PlayerAuctionPoster";
import {
  Trophy,
  Calendar,
  FileImage,
  AlertCircle,
  Clock,
  ArrowRight,
  Download,
  Eye,
  X,
  Sparkles,
} from "lucide-react";

export default function PlayerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user && user.role !== "PLAYER") {
      router.push(user.role === "ORGANIZER" ? "/dashboard/organizer" : "/admin");
    } else if (user) {
      setFetching(true);
      apiClient<Registration[]>("/tournaments/player/my-registrations")
        .then(setRegistrations)
        .catch((err) => setError(err.message))
        .finally(() => setFetching(false));
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-slate-400">
        Authenticating Player Arena...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="orange">Athlete Arena</Badge>
              <span className="text-xs text-slate-400 font-mono">ID: {user.id}</span>
            </div>
            <h1 className="text-3xl font-black uppercase text-white tracking-tight">
              Welcome, <span className="text-orange-500">{user.full_name}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Active sports profile, serial registrations, and generated auction posters
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/tournaments">
              <Button variant="primary" size="sm">
                Browse Tournaments
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Card & Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-[#11141c] border border-slate-800 sports-card-glow">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              Verified Athlete Identity
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-500 uppercase">Full Name</span>
                <p className="font-semibold text-white">{user.full_name}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase">Email</span>
                <p className="font-semibold text-slate-200">{user.email}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase">Phone</span>
                <p className="font-semibold text-slate-200">{user.phone_number || "Not set"}</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#11141c] border border-slate-800 sports-card-glow flex flex-col justify-between">
            <div>
              <div className="text-xs text-orange-400 font-semibold uppercase mb-2">
                Active Tournaments
              </div>
              <div className="text-3xl font-black text-white">{registrations.length}</div>
              <div className="text-xs font-semibold uppercase text-slate-400 mt-1">
                Total Registrations
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Eligible for live franchise player bidding rounds.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#11141c] border border-slate-800 sports-card-glow flex flex-col justify-between">
            <div>
              <div className="text-xs text-emerald-400 font-semibold uppercase mb-2">
                Verified Match Posters
              </div>
              <div className="text-3xl font-black text-white">
                {registrations.filter((r) => r.status === "APPROVED").length}
              </div>
              <div className="text-xs font-semibold uppercase text-slate-400 mt-1">
                Approved Match Slides
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Rendered via deterministic Pillow engine.
            </p>
          </div>
        </div>

        {/* Player Registrations and Posters Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold uppercase text-white tracking-wide mb-4">
            My Registered Events & Posters
          </h2>

          {fetching ? (
            <div className="text-center py-12 text-slate-500">Loading registrations...</div>
          ) : registrations.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#11141c] border border-slate-800 text-center">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white uppercase">No Active Registrations</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
                You haven't registered for any sports tournaments yet. Find upcoming volleyball, cricket, or football events to create your official matchday poster.
              </p>
              <Link href="/tournaments">
                <Button variant="outline" size="sm">
                  View Tournaments
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registrations.map((reg) => {
                const serialDisplay =
                  reg.serial_str ||
                  (reg.serial_number ? `${reg.serial_number}`.padStart(2, "0") : "01");
                const villageDisplay =
                  reg.village || reg.custom_field_values?.village || "KOKARNE";
                const roleDisplay =
                  reg.role || reg.custom_field_values?.role || "BLOCKER";

                return (
                  <div
                    key={reg.id}
                    className="rounded-2xl bg-[#11141c] border border-slate-800 overflow-hidden sports-card-glow flex flex-col justify-between hover:border-yellow-400/40 transition-colors"
                  >
                    <div>
                      {/* 16:9 Poster Preview */}
                      <div className="relative aspect-video bg-[#070a12] border-b border-slate-800 flex items-center justify-center overflow-hidden group">
                        {reg.poster_url ? (
                          <img
                            src={getFullStorageUrl(reg.poster_url)}
                            alt="Poster"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <FileImage className="w-10 h-10 text-yellow-400/60 mx-auto mb-2" />
                            <span className="text-xs text-slate-400">Rendering Poster...</span>
                          </div>
                        )}

                        <div className="absolute top-3 left-3">
                          <Badge
                            variant={
                              reg.status === "APPROVED"
                                ? "green"
                                : reg.status === "REJECTED"
                                ? "blue"
                                : "orange"
                            }
                          >
                            {reg.status}
                          </Badge>
                        </div>

                        <div className="absolute top-3 right-3 bg-black/80 border border-yellow-400 text-yellow-400 px-2.5 py-0.5 rounded-full font-mono font-black text-xs">
                          #{serialDisplay}
                        </div>

                        <button
                          onClick={() => setSelectedReg(reg)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white font-bold text-xs backdrop-blur-xs transition-opacity"
                        >
                          <Eye className="w-4 h-4 text-yellow-400" />
                          <span>Preview Slide</span>
                        </button>
                      </div>

                      <div className="p-5">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-base font-black text-white uppercase truncate">
                            {reg.player_name}
                          </h3>
                          <span className="text-xs font-mono font-bold text-yellow-400">
                            #{serialDisplay}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mb-3 font-mono">
                          {reg.registration_number}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-[#171b26] p-3 rounded-lg border border-slate-800/80 mb-3">
                          <div>
                            <span className="text-slate-500 uppercase text-[10px] block">Village</span>
                            <span className="font-bold text-white uppercase truncate block">
                              {villageDisplay}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 uppercase text-[10px] block">Role</span>
                            <span className="font-bold text-yellow-400 uppercase truncate block">
                              {roleDisplay}
                            </span>
                          </div>
                        </div>

                        {reg.rejection_reason && (
                          <p className="text-xs text-red-400 italic mb-2">
                            Feedback: {reg.rejection_reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-5 pt-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedReg(reg)}
                          className="flex-1 text-xs text-slate-300 border-slate-700 hover:text-white"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-yellow-400" />
                          Preview
                        </Button>

                        <Button
                          size="sm"
                          className="flex-1 text-xs bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold"
                          onClick={() => {
                            const pUrl = reg.poster_url;
                            if (pUrl) {
                              window.open(getFullStorageUrl(pUrl), "_blank");
                            } else {
                              alert("Poster is still rendering.");
                            }
                          }}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          Download PNG
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Player Poster Preview & Download */}
        {selectedReg && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#11141c] border border-yellow-400/50 rounded-2xl max-w-5xl w-full p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div>
                  <h3 className="font-black text-white uppercase text-base flex items-center gap-2">
                    <span className="text-yellow-400">#{selectedReg.serial_str || "01"}</span>
                    <span>{selectedReg.player_name}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Official 16:9 Matchday Poster & Live Auction Slide
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReg(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <PlayerAuctionPoster
                playerName={selectedReg.player_name}
                serialStr={
                  selectedReg.serial_str ||
                  (selectedReg.serial_number ? `${selectedReg.serial_number}`.padStart(2, "0") : "01")
                }
                village={selectedReg.village || selectedReg.custom_field_values?.village || "KOKARNE"}
                role={selectedReg.role || selectedReg.custom_field_values?.role || "BLOCKER"}
                phone={selectedReg.player_phone}
                sport="VOLLEYBALL"
                tournamentTitle="SPORTBID TOURNAMENT"
                photoUrl={selectedReg.player_photo_url}
                posterUrl={selectedReg.poster_url || undefined}
                showActions={true}
              />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tournament, Registration } from "@/lib/tournament-types";
import { useAuth } from "@/lib/auth-context";
import { apiClient, API_BASE_URL, getFullStorageUrl } from "@/lib/api";
import { PlayerAuctionPoster } from "@/components/poster/PlayerAuctionPoster";
import {
  CheckCircle2,
  XCircle,
  FileImage,
  AlertCircle,
  ExternalLink,
  Users,
  Clock,
  ArrowLeft,
  Download,
  Eye,
  X,
  Share2,
} from "lucide-react";

import { Suspense } from "react";

function ReviewContent({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const resolvedParams = use(params);
  const tournamentId = resolvedParams.tournamentId;

  const { user, loading } = useAuth();
  const router = useRouter();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);

  const loadData = async () => {
    try {
      setFetching(true);
      const [tData, rData] = await Promise.all([
        apiClient<Tournament>(`/tournaments/${tournamentId}`),
        apiClient<Registration[]>(`/tournaments/${tournamentId}/registrations`),
      ]);
      setTournament(tData);
      setRegistrations(rData);
    } catch (err: any) {
      setError(err.message || "Failed to load registrations.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      loadData();
    }
  }, [tournamentId, user, loading]);

  const handleReview = async (registrationId: string, status: "APPROVED" | "REJECTED") => {
    try {
      let rejection_reason = undefined;
      if (status === "REJECTED") {
        const reason = prompt("Enter reason for rejection (optional):");
        rejection_reason = reason || "Does not meet tournament criteria";
      }

      await apiClient(
        `/tournaments/${tournamentId}/registrations/${registrationId}/review`,
        {
          data: { status, rejection_reason },
        }
      );
      loadData();
    } catch (err: any) {
      alert(`Review action failed: ${err.message}`);
    }
  };

  const handleDownloadAllZip = async () => {
    try {
      setDownloadingZip(true);
      const url = `${API_BASE_URL}/tournaments/${tournamentId}/posters/zip`;
      window.open(url, "_blank");
    } catch (e: any) {
      alert(`Download failed: ${e.message}`);
    } finally {
      setTimeout(() => setDownloadingZip(false), 2000);
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-slate-400">
        Loading review desk...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => router.push("/dashboard/organizer")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Organizer Console
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="orange">Poster Review & Auction Desk</Badge>
              <span className="text-xs text-slate-400 font-mono">
                {tournament?.title}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
              Player Registrations & <span className="sports-gradient-text">Posters</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Sequential serial numbers, matchday posters, and live auction slides
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleDownloadAllZip}
              disabled={downloadingZip || registrations.length === 0}
              className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold text-xs shadow-md"
            >
              <Download className="w-4 h-4 mr-1.5" />
              {downloadingZip ? "Archiving..." : `Download All Posters (${registrations.length} ZIP)`}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const regUrl = `${window.location.origin}/tournament/${tournamentId}/register`;
                navigator.clipboard.writeText(regUrl);
                alert("Player registration link copied to clipboard!");
              }}
              className="text-xs"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5 text-yellow-400" />
              Copy Player Link
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {registrations.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#11141c] border border-slate-800 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white uppercase">No Player Registrations Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Share the unique tournament link with players on WhatsApp to begin receiving athlete submissions and generating match posters.
            </p>
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
                    {/* Poster Thumbnail / Preview Header */}
                    <div className="relative aspect-video bg-[#070a12] border-b border-slate-800 flex items-center justify-center overflow-hidden group">
                      {reg.poster_url ? (
                        <img
                          src={getFullStorageUrl(reg.poster_url)}
                          alt="Match Poster"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <FileImage className="w-10 h-10 text-yellow-400/60 mx-auto mb-2" />
                          <span className="text-xs text-slate-400">Rendering 16:9 Poster...</span>
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-2.5 left-2.5">
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

                      {/* Serial Number Pill */}
                      <div className="absolute top-2.5 right-2.5 bg-black/80 border border-yellow-400 text-yellow-400 px-2.5 py-0.5 rounded-full font-mono font-black text-xs">
                        #{serialDisplay}
                      </div>

                      {/* Quick Preview Overlay Button */}
                      <button
                        onClick={() => setSelectedReg(reg)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white font-bold text-xs backdrop-blur-xs transition-opacity"
                      >
                        <Eye className="w-4 h-4 text-yellow-400" />
                        <span>Preview Full Slide</span>
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
                      <div className="text-xs text-slate-400 mb-3">{reg.player_phone}</div>

                      {/* Sports Attributes */}
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
                          Reason: {reg.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-5 pt-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedReg(reg)}
                        className="flex-1 text-xs text-slate-300 border-slate-700 hover:text-white"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-yellow-400" />
                        Preview Poster
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

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                      {reg.status !== "APPROVED" && (
                        <Button
                          variant="accent"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleReview(reg.id, "APPROVED")}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </Button>
                      )}
                      {reg.status !== "REJECTED" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 text-xs text-red-400 hover:text-red-300"
                          onClick={() => handleReview(reg.id, "REJECTED")}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Full 16:9 Auction Slide Preview */}
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
                    Official 16:9 Player Matchday Poster & Live Auction Slide
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
                sport={tournament?.sport || "VOLLEYBALL"}
                tournamentTitle={tournament?.title || "SPORTBID TOURNAMENT"}
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

export default function TournamentRegistrationsReviewPage(props: {
  params: Promise<{ tournamentId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090a0f] text-slate-400 flex items-center justify-center">
          Loading review desk...
        </div>
      }
    >
      <ReviewContent {...props} />
    </Suspense>
  );
}

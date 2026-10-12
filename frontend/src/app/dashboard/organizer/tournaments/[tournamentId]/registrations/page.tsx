"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tournament, Registration } from "@/lib/tournament-types";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import {
  CheckCircle2,
  XCircle,
  FileImage,
  AlertCircle,
  ExternalLink,
  Users,
  Clock,
  ArrowLeft,
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
  const [selectedPoster, setSelectedPoster] = useState<string | null>(null);

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
      // Reload registrations to update status
      loadData();
    } catch (err: any) {
      alert(`Review action failed: ${err.message}`);
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
              <Badge variant="orange">Poster Review Desk</Badge>
              <span className="text-xs text-slate-400 font-mono">
                {tournament?.title}
              </span>
            </div>
            <h1 className="text-3xl font-black uppercase text-white tracking-tight">
              Player Registrations &{" "}
              <span className="sports-gradient-text">Posters</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Verify athlete information and approve match posters before public publication
            </p>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Total Submissions: <strong className="text-white">{registrations.length}</strong>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {registrations.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#11141c] border border-slate-800 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white uppercase">No Player Registrations Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Share the unique tournament link with players on WhatsApp or social media to begin receiving athlete submissions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className="rounded-2xl bg-[#11141c] border border-slate-800 overflow-hidden sports-card-glow flex flex-col justify-between"
              >
                <div>
                  {/* Poster Thumbnail / Preview */}
                  <div className="relative aspect-[4/5] bg-slate-900 border-b border-slate-800 flex items-center justify-center overflow-hidden group">
                    {reg.poster_url ? (
                      <img
                        src={reg.poster_url}
                        alt="Match Poster"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <FileImage className="w-10 h-10 text-slate-600 mx-auto mb-2" />
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
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-bold text-white uppercase">{reg.player_name}</h3>
                      <span className="text-xs font-mono text-orange-400">{reg.registration_number}</span>
                    </div>
                    <div className="text-xs text-slate-400 mb-4">{reg.player_phone}</div>

                    {/* Attributes */}
                    <div className="space-y-1 text-xs text-slate-300 bg-[#171b26] p-3 rounded-lg border border-slate-800/80 mb-4">
                      {Object.entries(reg.custom_field_values).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-slate-500 uppercase">{k}:</span>
                          <span className="font-semibold text-slate-200">{String(v)}</span>
                        </div>
                      ))}
                    </div>

                    {reg.rejection_reason && (
                      <p className="text-xs text-red-400 italic mb-2">
                        Reason: {reg.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Organizer Action Buttons */}
                <div className="p-5 pt-0 border-t border-slate-800/60 flex items-center gap-2">
                  {reg.status !== "APPROVED" && (
                    <Button
                      variant="accent"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleReview(reg.id, "APPROVED")}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Approve & Publish
                    </Button>
                  )}
                  {reg.status !== "REJECTED" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 text-red-400 hover:text-red-300"
                      onClick={() => handleReview(reg.id, "REJECTED")}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                  )}
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

export default function TournamentRegistrationsReviewPage(props: {
  params: Promise<{ tournamentId: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090a0f] text-slate-400 flex items-center justify-center">Loading review desk...</div>}>
      <ReviewContent {...props} />
    </Suspense>
  );
}

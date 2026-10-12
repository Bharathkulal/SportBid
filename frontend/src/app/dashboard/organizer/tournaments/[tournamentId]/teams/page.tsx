"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Header, Footer } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Team } from "@/lib/auction-types";
import { Tournament } from "@/lib/tournament-types";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import {
  Shield,
  PlusCircle,
  Users,
  AlertCircle,
  ArrowLeft,
  DollarSign,
  UserCheck,
} from "lucide-react";

interface TeamFormData {
  name: string;
  owner_name: string;
  owner_phone: string;
  initial_budget: number;
  roster_limit: number;
  representative_email?: string;
}

function TeamsContent({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const resolvedParams = use(params);
  const tournamentId = resolvedParams.tournamentId;

  const { user, loading } = useAuth();
  const router = useRouter();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<TeamFormData>({
    defaultValues: {
      initial_budget: 100000,
      roster_limit: 15,
    },
  });

  const loadData = async () => {
    try {
      setFetching(true);
      const [tData, teamData] = await Promise.all([
        apiClient<Tournament>(`/tournaments/${tournamentId}`),
        apiClient<Team[]>(`/tournaments/${tournamentId}/teams`),
      ]);
      setTournament(tData);
      setTeams(teamData);
    } catch (err: any) {
      setServerError(err.message || "Failed to load teams.");
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

  const onSubmit = async (data: TeamFormData) => {
    try {
      setServerError(null);
      setSubmitting(true);
      await apiClient(`/tournaments/${tournamentId}/teams`, {
        data: {
          ...data,
          initial_budget: Number(data.initial_budget),
          roster_limit: Number(data.roster_limit),
        },
      });
      reset();
      loadData();
    } catch (err: any) {
      setServerError(err.message || "Failed to create team.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-slate-400">
        Loading tournament teams...
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
              <Badge variant="green">Tournament Franchise Hub</Badge>
              <span className="text-xs text-slate-400 font-mono">
                {tournament?.title}
              </span>
            </div>
            <h1 className="text-3xl font-black uppercase text-white tracking-tight">
              Manage <span className="sports-gradient-text">Teams & Purses</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Add franchise owners, set auction purses, and track acquired rosters
            </p>
          </div>
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {serverError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Team Form */}
          <div className="rounded-2xl bg-[#11141c] border border-slate-800 p-6 sports-card-glow h-fit">
            <h2 className="text-lg font-bold uppercase text-white mb-1 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              Register Franchise
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Create a team with allocated budget purse for the auction.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Team / Franchise Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Thunder Spikers"
                  {...register("name", { required: true })}
                  className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Owner / Representative Name
                </label>
                <input
                  type="text"
                  placeholder="Owner Name"
                  {...register("owner_name", { required: true })}
                  className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Owner Phone
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 00000"
                  {...register("owner_phone", { required: true })}
                  className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Purse Budget (INR)
                  </label>
                  <input
                    type="number"
                    {...register("initial_budget", { required: true })}
                    className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Roster Limit
                  </label>
                  <input
                    type="number"
                    {...register("roster_limit", { required: true })}
                    className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Assigned Bidder Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="bidder@sportbid.com"
                  {...register("representative_email")}
                  className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <Button
                type="submit"
                variant="accent"
                size="md"
                className="w-full mt-2"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Create Team"}
              </Button>
            </form>
          </div>

          {/* Teams List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold uppercase text-white flex items-center justify-between">
              <span>Franchises ({teams.length})</span>
            </h2>

            {teams.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#11141c] border border-slate-800 text-center">
                <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white uppercase">No Teams Created</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Add franchise teams above to assign auction budgets and start bidding.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="rounded-xl bg-[#11141c] border border-slate-800 p-5 sports-card-glow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-bold text-white uppercase">{team.name}</h3>
                        <Badge variant="green">
                          ₹{team.remaining_budget.toLocaleString()}
                        </Badge>
                      </div>

                      <div className="text-xs text-slate-400 mb-3">
                        Owner: <strong className="text-slate-200">{team.owner_name}</strong> &bull; {team.owner_phone}
                      </div>

                      <div className="bg-[#171b26] rounded-lg p-3 text-xs text-slate-300 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Acquired Squad:</span>
                          <strong className="text-white">
                            {team.purchased_players_count} / {team.roster_limit}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Initial Purse:</span>
                          <span>₹{team.initial_budget.toLocaleString()}</span>
                        </div>
                      </div>

                      {team.purchased_players && team.purchased_players.length > 0 && (
                        <div className="mt-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Purchased Roster
                          </span>
                          <div className="mt-1 space-y-1">
                            {team.purchased_players.map((p) => (
                              <div
                                key={p.registration_id}
                                className="flex justify-between text-xs py-0.5 border-b border-slate-800/60"
                              >
                                <span className="text-slate-300 truncate">{p.player_name}</span>
                                <span className="text-emerald-400 font-semibold">₹{p.sold_price.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function TournamentTeamsPage(props: {
  params: Promise<{ tournamentId: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090a0f] text-slate-400 flex items-center justify-center">Loading teams...</div>}>
      <TeamsContent {...props} />
    </Suspense>
  );
}

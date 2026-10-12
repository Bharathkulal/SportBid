"use client";

import { use, useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuctionState, Team } from "@/lib/auction-types";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import {
  Gavel,
  Clock,
  TrendingUp,
  AlertCircle,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Users,
  Shield,
  DollarSign,
  ArrowRight,
} from "lucide-react";

function AuctionRoomContent({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const resolvedParams = use(params);
  const tournamentId = resolvedParams.tournamentId;

  const { user, loading } = useAuth();
  const router = useRouter();

  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [customBidAmount, setCustomBidAmount] = useState<number>(0);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);

  const loadState = async () => {
    try {
      const state = await apiClient<AuctionState>(`/tournaments/${tournamentId}/auction/state`);
      setAuctionState(state);
      if (state.teams.length > 0 && !selectedTeamId) {
        setSelectedTeamId(state.teams[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load live auction state.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadState();

    // Establish WebSocket for live real-time auction event streaming
    const wsUrl = `ws://localhost:8000/api/v1/tournaments/${tournamentId}/auction/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "NEW_BID" || msg.type === "STATE_CHANGE") {
          loadState();
        }
      } catch (e) {
        console.error("WS error", e);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [tournamentId]);

  // Countdown Timer
  useEffect(() => {
    if (!auctionState?.timer_deadline || auctionState.status !== "LIVE") {
      setSecondsRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(auctionState.timer_deadline!).getTime() - Date.now()) / 1000)
      );
      setSecondsRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [auctionState?.timer_deadline, auctionState?.status]);

  const handlePlaceBid = async (amount: number) => {
    if (!selectedTeamId) {
      alert("Please select a team to bid on behalf of.");
      return;
    }
    try {
      setSubmittingBid(true);
      await apiClient(`/tournaments/${tournamentId}/auction/bid`, {
        data: {
          team_id: selectedTeamId,
          amount,
        },
      });
      loadState();
    } catch (err: any) {
      alert(`Bid rejected: ${err.message}`);
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleAuctioneerControl = async (action: string) => {
    try {
      await apiClient(`/tournaments/${tournamentId}/auction/control/${action}`, {
        method: "POST",
      });
      loadState();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  if (fetching || loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-slate-400">
        Connecting to live auction arena...
      </div>
    );
  }

  if (!auctionState) {
    return (
      <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-[#11141c] border border-slate-800 p-8 rounded-2xl">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold uppercase text-white">Auction Not Configured</h2>
            <p className="text-xs text-slate-400 mt-2 mb-6">
              The organizer has not yet scheduled or configured the player auction room for this tournament.
            </p>
            <Button variant="primary" size="sm" onClick={() => router.push("/tournaments")}>
              Return to Tournaments
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currentLot = auctionState.current_lot;
  const isOrganizerOrAdmin = user?.role === "ORGANIZER" || user?.role === "SUPER_ADMIN";

  const currentBid = currentLot?.current_bid || 0;
  const nextMinBid =
    currentBid > 0 ? currentBid + auctionState.min_bid_increment : currentLot?.base_price || 1000;

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Live Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#11141c] border border-slate-800 p-5 rounded-2xl sports-card-glow mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-emerald-500 flex items-center justify-center">
              <Gavel className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black uppercase text-white tracking-tight">
                  {auctionState.name}
                </h1>
                <Badge
                  variant={
                    auctionState.status === "LIVE"
                      ? "green"
                      : auctionState.status === "PAUSED"
                      ? "orange"
                      : "slate"
                  }
                >
                  {auctionState.status}
                </Badge>
              </div>
              <span className="text-xs text-slate-400">
                Lot {auctionState.current_lot_index + 1} of {auctionState.total_lots_count} &bull;{" "}
                {auctionState.sold_lots_count} Sold &bull; {auctionState.unsold_lots_count} Unsold
              </span>
            </div>
          </div>

          {/* Organizer / Auctioneer Direct Controls */}
          {isOrganizerOrAdmin && (
            <div className="flex flex-wrap items-center gap-2">
              {auctionState.status !== "LIVE" ? (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => handleAuctioneerControl("START")}
                >
                  <Play className="w-3.5 h-3.5 mr-1" />
                  Start / Resume Auction
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAuctioneerControl("PAUSE")}
                >
                  <Pause className="w-3.5 h-3.5 mr-1" />
                  Pause
                </Button>
              )}

              {auctionState.status === "LIVE" && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAuctioneerControl("SOLD")}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Hammer: SOLD
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-400 border-red-500/40 hover:bg-red-500/10"
                    onClick={() => handleAuctioneerControl("UNSOLD")}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Mark Unsold
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Main Auction Floor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Player Card & Poster */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-[#11141c] border border-slate-800 p-6 sports-card-glow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Player Lot On Floor
                </span>
                {auctionState.status === "LIVE" && (
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/30 animate-pulse">
                    <Clock className="w-3.5 h-3.5" />
                    {secondsRemaining}s
                  </div>
                )}
              </div>

              {currentLot ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Poster Showcase */}
                  <div className="aspect-[4/5] bg-slate-900 rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl relative">
                    {currentLot.poster_url ? (
                      <img
                        src={currentLot.poster_url}
                        alt={currentLot.player_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                        Official Match Poster
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-md p-2.5 rounded-lg border border-slate-700">
                      <div className="text-xs font-mono text-orange-400 font-bold">
                        {currentLot.registration_id}
                      </div>
                      <div className="text-sm font-bold text-white uppercase truncate">
                        {currentLot.player_name}
                      </div>
                    </div>
                  </div>

                  {/* Lot Details & Bidding Metrics */}
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-slate-400 uppercase">Current Bid</span>
                      <div className="text-4xl sm:text-5xl font-black text-emerald-400 mt-1">
                        ₹{currentBid.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-300 mt-1">
                        Highest Bidder:{" "}
                        <strong className="text-white">
                          {currentLot.highest_bidder_team_name || "None (At Base Price)"}
                        </strong>
                      </div>
                    </div>

                    <div className="bg-[#171b26] p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 uppercase">Sport:</span>
                        <span className="font-semibold text-white">{currentLot.sport}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 uppercase">Role / Pos:</span>
                        <span className="font-semibold text-white">{currentLot.role_or_pos}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 uppercase">Base Price:</span>
                        <span className="font-semibold text-orange-400">
                          ₹{currentLot.base_price.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 uppercase">Next Minimum Bid:</span>
                        <span className="font-semibold text-emerald-400">
                          ₹{nextMinBid.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Live Bidding Action Box */}
                    {auctionState.status === "LIVE" ? (
                      <div className="pt-2 space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                            Bidding as Franchise:
                          </label>
                          <select
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="w-full bg-[#171b26] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                          >
                            {auctionState.teams.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} (Purse: ₹{t.remaining_budget.toLocaleString()})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="primary"
                            size="md"
                            disabled={submittingBid}
                            onClick={() => handlePlaceBid(nextMinBid)}
                          >
                            Bid +₹{auctionState.min_bid_increment}
                          </Button>
                          <Button
                            variant="accent"
                            size="md"
                            disabled={submittingBid}
                            onClick={() => handlePlaceBid(nextMinBid + auctionState.min_bid_increment * 2)}
                          >
                            Jump Bid (+₹{auctionState.min_bid_increment * 2})
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-800/40 rounded-lg text-xs text-slate-400 text-center">
                        Auction room is {auctionState.status}. Bids will open when live.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-500">
                  <Gavel className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <h3 className="text-base font-bold text-white uppercase">
                    {auctionState.status === "COMPLETED"
                      ? "Auction Completed!"
                      : "No Player on Floor Yet"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {auctionState.status === "COMPLETED"
                      ? "All player lots have been auctioned and rosters assigned."
                      : "The auctioneer will call the first player lot to begin."}
                  </p>
                </div>
              )}
            </div>

            {/* Live Bid History Stream */}
            <div className="rounded-2xl bg-[#11141c] border border-slate-800 p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Live Bidding Stream
              </h3>

              {auctionState.bids_history.length === 0 ? (
                <div className="text-xs text-slate-500 py-4 text-center">
                  No bids recorded on this lot yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {auctionState.bids_history.map((bid) => (
                    <div
                      key={bid.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#171b26] border border-slate-800 text-xs"
                    >
                      <div>
                        <span className="font-bold text-white uppercase">{bid.team_name}</span>
                        <span className="text-[10px] text-slate-500 ml-2">
                          {new Date(bid.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm font-black text-emerald-400">
                        ₹{bid.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Franchise Purses & Squad Status Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#11141c] border border-slate-800 p-6 sports-card-glow">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-400" />
                Franchise Purses ({auctionState.teams.length})
              </h3>

              <div className="space-y-3">
                {auctionState.teams.map((team) => (
                  <div
                    key={team.id}
                    className="p-3.5 rounded-xl bg-[#171b26] border border-slate-800/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs uppercase">{team.name}</span>
                      <span className="text-xs font-black text-emerald-400">
                        ₹{team.remaining_budget.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Roster:</span>
                      <span>
                        {team.purchased_players_count} / {team.roster_limit} Players
                      </span>
                    </div>

                    {/* Progress Bar of Purse Spent */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            (team.remaining_budget / team.initial_budget) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function LiveAuctionRoomPage(props: {
  params: Promise<{ tournamentId: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090a0f] text-slate-400 flex items-center justify-center">Connecting to live auction...</div>}>
      <AuctionRoomContent {...props} />
    </Suspense>
  );
}

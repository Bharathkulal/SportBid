"use client";

import { use, useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuctionState, Team, AuctionPlayerLot } from "@/lib/auction-types";
import { useAuth } from "@/lib/auth-context";
import { apiClient, getWebSocketUrl } from "@/lib/api";
import { PlayerAuctionPoster } from "@/components/poster/PlayerAuctionPoster";
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
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Download,
  Tv,
  ListFilter,
  Check,
  Eye,
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
  const [projectorMode, setProjectorMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"floor" | "roster">("floor");

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
    const wsUrl = getWebSocketUrl(`/tournaments/${tournamentId}/auction/ws`);
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

  // Fullscreen keyboard listener (ESC to exit projector mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && projectorMode) {
        setProjectorMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [projectorMode]);

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
      await apiClient(`/tournaments/${tournamentId}/auction/control/${encodeURIComponent(action)}`, {
        method: "POST",
      });
      loadState();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleSelectLot = (registrationId: string) => {
    handleAuctioneerControl(`SELECT_LOT:${registrationId}`);
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
  const allLots = auctionState.all_lots || [];
  const isOrganizerOrAdmin = user?.role === "ORGANIZER" || user?.role === "SUPER_ADMIN";

  const currentBid = currentLot?.current_bid || 0;
  const nextMinBid =
    currentBid > 0 ? currentBid + auctionState.min_bid_increment : currentLot?.base_price || 1000;

  // Extract poster info from current lot
  const posterPlayerName = currentLot?.player_name || "PLAYER NAME";
  const posterSerialStr =
    currentLot?.serial_str ||
    (currentLot?.serial_number ? `${currentLot.serial_number < 10 ? "0" : ""}${currentLot.serial_number}` : "01");
  const posterVillage = currentLot?.village || "KOKARNE";
  const posterRole = currentLot?.role || currentLot?.role_or_pos || "BLOCKER";
  const posterPhone = currentLot?.phone || "+91 XXXXXXXXXX";
  const posterPhoto = currentLot?.photo_url || "";
  const posterUrl = currentLot?.poster_url || "";

  // ------------------------------------------------------------------------
  // FULL-SCREEN PROJECTOR MODE SLIDE VIEW
  // ------------------------------------------------------------------------
  if (projectorMode) {
    return (
      <div className="fixed inset-0 z-50 bg-[#070a12] text-white flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none">
        {/* Projector Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-yellow-400/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 text-slate-950 font-black flex items-center justify-center">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-black uppercase text-yellow-400 tracking-tight">
                {auctionState.name} &bull; LIVE AUCTION SLIDE
              </h1>
              <p className="text-[11px] text-slate-400">
                Lot {auctionState.current_lot_index + 1} of {auctionState.total_lots_count} &bull;{" "}
                {auctionState.sold_lots_count} Sold &bull; {auctionState.unsold_lots_count} Unsold
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

            <Button
              variant="outline"
              size="sm"
              onClick={() => setProjectorMode(false)}
              className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10 text-xs font-bold"
            >
              <Minimize2 className="w-4 h-4 mr-1.5" />
              Exit Projector (ESC)
            </Button>
          </div>
        </div>

        {/* Center: 16:9 Presentation Slide Poster */}
        <div className="flex-1 flex items-center justify-center py-2 sm:py-4 min-h-0">
          {currentLot ? (
            <PlayerAuctionPoster
              playerName={posterPlayerName}
              serialStr={posterSerialStr}
              village={posterVillage}
              role={posterRole}
              phone={posterPhone}
              photoUrl={posterPhoto}
              posterUrl={posterUrl}
              sport={auctionState.sport || currentLot.sport || "VOLLEYBALL"}
              tournamentTitle={auctionState.name}
              fullScreenMode={true}
              showActions={false}
              currentBid={currentBid}
              highestBidderName={currentLot.highest_bidder_team_name}
              basePrice={currentLot.base_price}
              secondsRemaining={secondsRemaining}
              auctionStatus={auctionState.status}
            />
          ) : (
            <div className="text-center py-20 text-slate-500">
              <Gavel className="w-16 h-16 mx-auto mb-4 text-yellow-400 opacity-60" />
              <h2 className="text-2xl font-bold uppercase text-white">No Player Lot On Floor</h2>
              <p className="text-sm text-slate-400 mt-2">
                Use the auctioneer navigation bar below to call a player to the auction floor.
              </p>
            </div>
          )}
        </div>

        {/* Projector Bottom Quick Action Bar (Organizer / Admin Controls) */}
        {isOrganizerOrAdmin && (
          <div className="pt-3 border-t border-yellow-400/30 flex flex-wrap items-center justify-between gap-3 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-slate-800">
            {/* Lot Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAuctioneerControl("PREV_LOT")}
                disabled={auctionState.current_lot_index <= 0}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous Lot
              </Button>

              {/* Quick Jump Selector */}
              <select
                value={currentLot?.registration_id || ""}
                onChange={(e) => handleSelectLot(e.target.value)}
                className="bg-slate-900 border border-yellow-400/60 rounded-lg px-3 py-1.5 text-xs text-yellow-300 font-bold focus:outline-none"
              >
                {allLots.map((l, idx) => (
                  <option key={l.registration_id} value={l.registration_id}>
                    #{l.serial_str || `${idx + 1 < 10 ? "0" : ""}${idx + 1}`} - {l.player_name} ({l.status})
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAuctioneerControl("NEXT_LOT")}
                disabled={auctionState.current_lot_index >= allLots.length - 1}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
              >
                Next Lot
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Auctioneer Live Action Triggers */}
            <div className="flex items-center gap-2">
              {auctionState.status !== "LIVE" ? (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => handleAuctioneerControl("START")}
                  className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs"
                >
                  <Play className="w-3.5 h-3.5 mr-1" />
                  Start Auction
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAuctioneerControl("PAUSE")}
                  className="text-xs"
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
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Hammer: SOLD
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAuctioneerControl("UNSOLD")}
                    className="text-red-400 border-red-500/40 hover:bg-red-500/10 text-xs"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Mark UNSOLD
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ------------------------------------------------------------------------
  // MAIN AUCTION FLOOR ARENA
  // ------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Live Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#11141c] border border-slate-800 p-5 rounded-2xl sports-card-glow mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Gavel className="w-5 h-5 text-slate-950" />
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

          {/* Action Bar: Projector Switcher & Auctioneer Direct Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Projector Fullscreen Mode Button */}
            <Button
              onClick={() => setProjectorMode(true)}
              className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs px-3.5 py-1.5 shadow-md flex items-center gap-1.5"
              title="Launch full-screen projector auction slide"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Projector Slide Mode
            </Button>

            {isOrganizerOrAdmin && (
              <>
                {/* Lot Nav Buttons */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => handleAuctioneerControl("PREV_LOT")}
                    disabled={auctionState.current_lot_index <= 0}
                    className="p-1.5 hover:bg-slate-800 text-slate-300 disabled:opacity-40 rounded transition-colors"
                    title="Previous Lot"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAuctioneerControl("NEXT_LOT")}
                    disabled={auctionState.current_lot_index >= allLots.length - 1}
                    className="p-1.5 hover:bg-slate-800 text-slate-300 disabled:opacity-40 rounded transition-colors"
                    title="Next Lot"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {auctionState.status !== "LIVE" ? (
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => handleAuctioneerControl("START")}
                  >
                    <Play className="w-3.5 h-3.5 mr-1" />
                    Start / Resume
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
                      className="bg-emerald-500 hover:bg-emerald-600 font-bold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Hammer: SOLD
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-400 border-red-500/40 hover:bg-red-500/10 font-bold"
                      onClick={() => handleAuctioneerControl("UNSOLD")}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Mark Unsold
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Floor View / Roster Switcher Tabs */}
        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("floor")}
            className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "floor"
                ? "bg-yellow-400 text-slate-950 font-black shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Gavel className="w-3.5 h-3.5" />
            Live Floor Slide & Bidding
          </button>
          <button
            onClick={() => setActiveTab("roster")}
            className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "roster"
                ? "bg-yellow-400 text-slate-950 font-black shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            Registered Players Roster ({allLots.length})
          </button>
        </div>

        {activeTab === "floor" ? (
          /* Main Auction Floor Grid */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Current Player Official Slide & Bidding Floor */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl bg-[#11141c] border border-slate-800 p-6 sports-card-glow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">
                      Official Player Auction Slide
                    </span>
                    <span className="text-[11px] text-slate-400">
                      (Synchronized Real-Time Slide)
                    </span>
                  </div>

                  {auctionState.status === "LIVE" && (
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/30 animate-pulse">
                      <Clock className="w-3.5 h-3.5" />
                      {secondsRemaining}s
                    </div>
                  )}
                </div>

                {currentLot ? (
                  <div className="space-y-6">
                    {/* The Official 16:9 Player Poster Slide */}
                    <div className="w-full">
                      <PlayerAuctionPoster
                        playerName={posterPlayerName}
                        serialStr={posterSerialStr}
                        village={posterVillage}
                        role={posterRole}
                        phone={posterPhone}
                        photoUrl={posterPhoto}
                        posterUrl={posterUrl}
                        sport={auctionState.sport || currentLot.sport || "VOLLEYBALL"}
                        tournamentTitle={auctionState.name}
                        showActions={true}
                        currentBid={currentBid}
                        highestBidderName={currentLot.highest_bidder_team_name}
                        basePrice={currentLot.base_price}
                        secondsRemaining={secondsRemaining}
                        auctionStatus={auctionState.status}
                        onToggleFullScreen={() => setProjectorMode(true)}
                      />
                    </div>

                    {/* Live Bidding & Franchise Action Bar */}
                    <div className="bg-[#171b26] p-5 rounded-xl border border-slate-800 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-3 border-b border-slate-800/80">
                        <div>
                          <span className="text-xs text-slate-400 uppercase">Current Bid</span>
                          <div className="text-3xl font-black text-emerald-400 mt-0.5">
                            ₹{currentBid.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-300 mt-1 truncate">
                            Leader:{" "}
                            <strong className="text-yellow-400">
                              {currentLot.highest_bidder_team_name || "None (At Base Price)"}
                            </strong>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs text-slate-400 uppercase">Base Price</span>
                          <div className="text-2xl font-bold text-orange-400 mt-0.5">
                            ₹{currentLot.base_price.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            Role: {posterRole}
                          </div>
                        </div>

                        <div>
                          <span className="text-xs text-slate-400 uppercase">Next Minimum Bid</span>
                          <div className="text-2xl font-bold text-emerald-400 mt-0.5">
                            ₹{nextMinBid.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            Increment: +₹{auctionState.min_bid_increment}
                          </div>
                        </div>
                      </div>

                      {/* Live Bidding Action Box */}
                      {auctionState.status === "LIVE" ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                              Bidding Franchise:
                            </label>
                            <select
                              value={selectedTeamId}
                              onChange={(e) => setSelectedTeamId(e.target.value)}
                              className="w-full bg-[#11141c] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400 font-medium"
                            >
                              {auctionState.teams.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name} (Purse Remaining: ₹{t.remaining_budget.toLocaleString()})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              variant="primary"
                              size="md"
                              disabled={submittingBid}
                              onClick={() => handlePlaceBid(nextMinBid)}
                              className="bg-emerald-500 hover:bg-emerald-600 font-black text-sm"
                            >
                              Bid ₹{nextMinBid.toLocaleString()} (+₹{auctionState.min_bid_increment})
                            </Button>
                            <Button
                              variant="accent"
                              size="md"
                              disabled={submittingBid}
                              onClick={() => handlePlaceBid(nextMinBid + auctionState.min_bid_increment * 2)}
                              className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-sm"
                            >
                              Jump Bid (+₹{auctionState.min_bid_increment * 2})
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-800/40 rounded-lg text-xs text-slate-400 text-center">
                          Auction room is {auctionState.status}. Bids will open when the auction is LIVE.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-500">
                    <Gavel className="w-14 h-14 mx-auto mb-3 text-yellow-400 opacity-60" />
                    <h3 className="text-base font-bold text-white uppercase">
                      {auctionState.status === "COMPLETED"
                        ? "Auction Completed!"
                        : "No Player Lot on Floor"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {auctionState.status === "COMPLETED"
                        ? "All player lots have been auctioned and rosters assigned."
                        : "The organizer will call the first player lot to begin."}
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

            {/* Franchise Purses Sidebar */}
            <div className="space-y-6">
              <div className="rounded-2xl bg-[#11141c] border border-slate-800 p-6 sports-card-glow">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-yellow-400" />
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
        ) : (
          /* All Registered Lots Roster View */
          <div className="bg-[#11141c] border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black uppercase text-white tracking-tight flex items-center gap-2">
                  <ListFilter className="w-5 h-5 text-yellow-400" />
                  All Registered Player Lots ({allLots.length})
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Click on any player to immediately display their official match poster on the auction floor and projector.
                </p>
              </div>
            </div>

            {allLots.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No player registrations found for this tournament yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allLots.map((lot, idx) => {
                  const isCurrent = currentLot?.registration_id === lot.registration_id;
                  const sStr = lot.serial_str || `${idx + 1 < 10 ? "0" : ""}${idx + 1}`;
                  return (
                    <div
                      key={lot.registration_id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isCurrent
                          ? "bg-yellow-400/10 border-yellow-400 shadow-lg"
                          : "bg-[#171b26] border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Photo Thumbnail */}
                        <div className="w-14 h-14 rounded-lg bg-slate-900 border border-yellow-400/50 overflow-hidden shrink-0 flex items-center justify-center">
                          {lot.photo_url ? (
                            <img
                              src={lot.photo_url}
                              alt={lot.player_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] text-yellow-400 font-bold">
                              #{sStr}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 font-mono font-bold text-[10px]">
                              #{sStr}
                            </span>
                            <Badge
                              variant={
                                lot.status === "SOLD"
                                  ? "green"
                                  : lot.status === "IN_AUCTION"
                                  ? "orange"
                                  : "slate"
                              }
                            >
                              {lot.status}
                            </Badge>
                          </div>
                          <h4 className="text-sm font-bold text-white uppercase truncate mt-1">
                            {lot.player_name}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            {lot.role || lot.role_or_pos} &bull; {lot.village || "KOKARNE"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Base Price</span>
                          <span className="text-xs font-bold text-orange-400">
                            ₹{lot.base_price.toLocaleString()}
                          </span>
                        </div>

                        {isOrganizerOrAdmin && (
                          <Button
                            size="sm"
                            variant={isCurrent ? "secondary" : "outline"}
                            onClick={() => {
                              handleSelectLot(lot.registration_id);
                              setActiveTab("floor");
                            }}
                            className={`text-[11px] h-7 px-2.5 ${
                              isCurrent
                                ? "border-yellow-400 text-yellow-400 font-bold"
                                : "border-slate-700 text-slate-300"
                            }`}
                          >
                            {isCurrent ? "On Floor Now" : "Call to Floor"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function LiveAuctionRoomPage(props: {
  params: Promise<{ tournamentId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090a0f] text-slate-400 flex items-center justify-center">
          Connecting to live auction...
        </div>
      }
    >
      <AuctionRoomContent {...props} />
    </Suspense>
  );
}

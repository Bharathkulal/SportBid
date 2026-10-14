"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Radio,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Play,
  Pause,
  StopCircle,
  DollarSign,
  Users,
  Trophy,
  Activity,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface AuctionItem {
  id: string;
  tournament_id: string;
  tournament_name?: string;
  sport?: string;
  status: string; // DRAFT | LIVE | PAUSED | COMPLETED
  current_player_id?: string;
  current_bid?: number;
  current_bidder_team_id?: string;
  teams_count?: number;
  created_at: string;
}

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient<AuctionItem[]>("/admin/auctions");
      setAuctions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load auctions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  const handleUpdateStatus = async (auctionId: string, newStatus: string) => {
    try {
      setUpdatingId(auctionId);
      setError(null);
      await apiClient(`/admin/auctions/${auctionId}/status`, {
        method: "PATCH",
        data: { new_status: newStatus },
      });
      setSuccessMsg(`Auction status changed to ${newStatus}`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchAuctions();
    } catch (err: any) {
      setError(err.message || "Failed to update auction status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredAuctions = auctions.filter((a) => {
    const term = search.toLowerCase();
    return (
      a.tournament_name?.toLowerCase().includes(term) ||
      a.sport?.toLowerCase().includes(term) ||
      a.id.toLowerCase().includes(term)
    );
  });

  const liveCount = auctions.filter((a) => a.status === "LIVE").length;
  const pausedCount = auctions.filter((a) => a.status === "PAUSED").length;
  const completedCount = auctions.filter((a) => a.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 text-emerald-600" />
            Live Auction Monitor & Deterministic State Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time supervisor over active bidding rooms, timer states, and status overrides.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAuctions}
          disabled={loading}
          className="self-start sm:self-auto bg-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI mini-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold uppercase">Total Auctions</span>
          <p className="text-xl font-black text-slate-900 mt-1">{auctions.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-emerald-600 font-semibold uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Now
          </span>
          <p className="text-xl font-black text-emerald-700 mt-1">{liveCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-amber-600 font-semibold uppercase">Paused</span>
          <p className="text-xl font-black text-amber-700 mt-1">{pausedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-blue-600 font-semibold uppercase">Completed</span>
          <p className="text-xl font-black text-blue-700 mt-1">{completedCount}</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by tournament name or sport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
        </div>
      </div>

      {/* Auctions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading auctions...</div>
          ) : filteredAuctions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No auctions configured yet in MongoDB.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Tournament & Room</th>
                  <th className="px-4 py-3.5 font-semibold">Sport</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 font-semibold">Current Top Bid</th>
                  <th className="px-4 py-3.5 font-semibold">Franchises</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Admin Overrides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAuctions.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {a.tournament_name || "Unnamed Tournament"}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Auction ID: {a.id}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {a.sport || "cricket"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          a.status === "LIVE"
                            ? "bg-emerald-100 text-emerald-800 animate-pulse"
                            : a.status === "PAUSED"
                            ? "bg-amber-100 text-amber-800"
                            : a.status === "COMPLETED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {a.status === "LIVE" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                        {a.status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        ₹{(a.current_bid || 0).toLocaleString("en-IN")}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-700 font-medium">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {a.teams_count ?? 0} Teams
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Status override dropdown */}
                        <select
                          disabled={updatingId === a.id}
                          value={a.status}
                          onChange={(e) => handleUpdateStatus(a.id, e.target.value)}
                          className="text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="DRAFT">DRAFT</option>
                          <option value="LIVE">LIVE</option>
                          <option value="PAUSED">PAUSED</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>

                        {/* Quick Pause/Resume */}
                        {a.status === "LIVE" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingId === a.id}
                            onClick={() => handleUpdateStatus(a.id, "PAUSED")}
                            className="text-amber-700 hover:bg-amber-50 border-amber-200 text-[11px] h-7 px-2"
                            title="Pause Live Auction"
                          >
                            <Pause className="w-3 h-3 mr-1" />
                            Pause
                          </Button>
                        ) : a.status === "PAUSED" ? (
                          <Button
                            size="sm"
                            disabled={updatingId === a.id}
                            onClick={() => handleUpdateStatus(a.id, "LIVE")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2"
                            title="Resume Live Auction"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Resume
                          </Button>
                        ) : null}

                        {/* Open Live Room */}
                        <Link
                          href={`/auction/${a.tournament_id}`}
                          target="_blank"
                          className="p-1.5 rounded hover:bg-emerald-50 text-emerald-700 border border-emerald-200 transition-colors flex items-center gap-1 font-semibold text-[11px]"
                          title="Open Live Auction Bidding Room"
                        >
                          <span>Room</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

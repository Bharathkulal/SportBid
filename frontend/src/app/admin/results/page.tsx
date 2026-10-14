"use client";

import { useEffect, useState } from "react";
import {
  Award,
  Search,
  RefreshCw,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Trophy,
  Users,
  Shield,
  FileSpreadsheet,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface AuctionResultsData {
  total_sold: number;
  total_unsold: number;
  total_spent: number;
  average_price: number;
  highest_bid: number;
  highest_bid_player?: string;
  sales: any[];
}

export default function AdminResultsPage() {
  const [data, setData] = useState<AuctionResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<AuctionResultsData>("/admin/results");
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load auction results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const filteredSales = (data?.sales || []).filter((s) => {
    const term = search.toLowerCase();
    return (
      s.player_name?.toLowerCase().includes(term) ||
      s.team_name?.toLowerCase().includes(term) ||
      s.tournament_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-600" />
            Auction Results & Financial Ledger
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Global ledger of completed bids, athlete allocations, franchise expenditures, and top sales.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchResults}
          disabled={loading}
          className="self-start sm:self-auto bg-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh Ledger
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Sold */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold uppercase">Athletes Sold</span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {loading ? "..." : data?.total_sold ?? 0}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">Successfully hammered</span>
        </div>

        {/* Total Unsold */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold uppercase">Passed / Unsold</span>
          <p className="text-2xl font-black text-slate-700 mt-1">
            {loading ? "..." : data?.total_unsold ?? 0}
          </p>
          <span className="text-[11px] text-slate-400">Available for re-auction</span>
        </div>

        {/* Total Spent */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold uppercase">Total Turnover</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {loading ? "..." : `₹${(data?.total_spent ?? 0).toLocaleString("en-IN")}`}
          </p>
          <span className="text-[11px] text-slate-400">Across all tournaments</span>
        </div>

        {/* Highest Bid */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold uppercase">Top Sale Price</span>
          <p className="text-2xl font-black text-purple-700 mt-1">
            {loading ? "..." : `₹${(data?.highest_bid ?? 0).toLocaleString("en-IN")}`}
          </p>
          <span className="text-[11px] text-slate-500 truncate block">
            {data?.highest_bid_player || "N/A"}
          </span>
        </div>

        {/* Average Price */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold uppercase">Average Price</span>
          <p className="text-2xl font-black text-blue-700 mt-1">
            {loading ? "..." : `₹${(data?.average_price ?? 0).toLocaleString("en-IN")}`}
          </p>
          <span className="text-[11px] text-slate-400">Per acquired player</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by player, winning franchise, or tournament..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
        </div>
      </div>

      {/* Sales Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
            Live Acquisition Transactions ({filteredSales.length})
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Real-time DB records</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading auction results...</div>
          ) : filteredSales.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No auction sale records recorded yet. Complete an auction round to view transactions here.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Player Acquired</th>
                  <th className="px-4 py-3.5 font-semibold">Winning Team</th>
                  <th className="px-4 py-3.5 font-semibold">Tournament</th>
                  <th className="px-4 py-3.5 font-semibold">Sale Price (INR)</th>
                  <th className="px-4 py-3.5 font-semibold">Date & Time</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSales.map((sale: any, idx: number) => (
                  <tr key={sale.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {sale.player_name || "Athlete"}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Shield className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{sale.team_name || "Franchise"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Trophy className="w-3 h-3 text-slate-400" />
                        <span>{sale.tournament_name || "Tournament"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-mono font-black text-emerald-700 text-sm">
                        ₹{(sale.final_price || 0).toLocaleString("en-IN")}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-500 font-mono text-[11px]">
                      {sale.sold_at || sale.timestamp
                        ? new Date(sale.sold_at || sale.timestamp).toLocaleString()
                        : "-"}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Hammer Down (SOLD)
                      </span>
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

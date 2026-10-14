"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  RefreshCw,
  AlertCircle,
  Trophy,
  Users,
  Shield,
  Radio,
  DollarSign,
  Activity,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface AnalyticsData {
  totals: {
    tournaments: number;
    organizers: number;
    players: number;
    teams: number;
    auctions: number;
    sales_volume: number;
  };
  sports_distribution: Record<string, number>;
  tournament_status_distribution: Record<string, number>;
  monthly_registrations: { month: string; count: number }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<AnalyticsData>("/admin/analytics");
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load platform analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalTournamentsForSports = Object.values(
    data?.sports_distribution || {}
  ).reduce((a, b) => a + b, 0);

  const totalTournamentsForStatus = Object.values(
    data?.tournament_status_distribution || {}
  ).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            Platform Statistics & Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time MongoDB aggregation metrics covering sports market shares, tournament stages, and athlete growth.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAnalytics}
          disabled={loading}
          className="self-start sm:self-auto bg-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh Analytics
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Platform Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">
            ₹{(data?.totals?.sales_volume ?? 0).toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-slate-400 mt-1">Purses allocated across all franchise auctions</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Athletes in System</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {data?.totals?.players ?? 0} Players
          </p>
          <p className="text-xs text-slate-400 mt-1">Registered for competitive bidding</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Franchise Count</span>
            <Shield className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {data?.totals?.teams ?? 0} Teams
          </p>
          <p className="text-xs text-slate-400 mt-1">Configured for deterministic bidding</p>
        </div>
      </div>

      {/* Two Column Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sport Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Tournaments by Sport</h3>
              <p className="text-xs text-slate-500">Breakdown across sporting disciplines</p>
            </div>
            <Trophy className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-xs text-slate-400 py-6 text-center">Loading distribution...</p>
            ) : !data?.sports_distribution || Object.keys(data.sports_distribution).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No sport data recorded yet.</p>
            ) : (
              Object.entries(data.sports_distribution).map(([sport, count]) => {
                const percentage =
                  totalTournamentsForSports > 0
                    ? Math.round((count / totalTournamentsForSports) * 100)
                    : 0;

                return (
                  <div key={sport} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="capitalize text-slate-800">{sport}</span>
                      <span className="text-slate-500 font-mono">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tournament Lifecycle Status Funnel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Tournament Lifecycle Status</h3>
              <p className="text-xs text-slate-500">Pipeline from draft creation to completion</p>
            </div>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-xs text-slate-400 py-6 text-center">Loading status breakdown...</p>
            ) : !data?.tournament_status_distribution ||
              Object.keys(data.tournament_status_distribution).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No tournaments created yet.</p>
            ) : (
              Object.entries(data.tournament_status_distribution).map(([st, count]) => {
                const percentage =
                  totalTournamentsForStatus > 0
                    ? Math.round((count / totalTournamentsForStatus) * 100)
                    : 0;

                const colorClass =
                  st === "PUBLISHED"
                    ? "bg-emerald-600"
                    : st === "AUCTION_ACTIVE"
                    ? "bg-purple-600"
                    : st === "REGISTRATION_CLOSED"
                    ? "bg-amber-600"
                    : st === "COMPLETED"
                    ? "bg-blue-600"
                    : "bg-slate-400";

                return (
                  <div key={st} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{st}</span>
                      <span className="text-slate-500 font-mono">
                        {count} events ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

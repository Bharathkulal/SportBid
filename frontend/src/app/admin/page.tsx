"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Users,
  UserCheck,
  Shield,
  Radio,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Activity,
  PlusCircle,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface AdminStats {
  tournaments_count: number;
  organizers_count: number;
  players_count: number;
  teams_count: number;
  auctions_count: number;
  live_auctions_count: number;
  completed_auctions_count: number;
  total_players_sold: number;
  total_sales_volume: number;
  recent_tournaments: any[];
  recent_activities: any[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient<AdminStats>("/admin/stats");
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load admin statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold backdrop-blur-xs border border-emerald-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SportBid Command Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Administrative Control Panel
          </h2>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Live overview of all tournaments, organizers, bidding events, player registrations,
            and deterministic auction states directly queried from MongoDB.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
            className="bg-white/10 text-white hover:bg-white/20 border-white/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
          <Link href="/admin/tournaments">
            <Button
              size="sm"
              className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold shadow-sm"
            >
              Manage Tournaments
              <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tournaments */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Tournaments
            </span>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">
              {loading ? "..." : stats?.tournaments_count ?? 0}
            </span>
            <p className="text-xs text-slate-500 mt-1">Multi-sport events registered</p>
          </div>
        </div>

        {/* Organizers */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Organizers
            </span>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">
              {loading ? "..." : stats?.organizers_count ?? 0}
            </span>
            <p className="text-xs text-slate-500 mt-1">Tournament hosts & organizations</p>
          </div>
        </div>

        {/* Players */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Registered Players
            </span>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">
              {loading ? "..." : stats?.players_count ?? 0}
            </span>
            <p className="text-xs text-slate-500 mt-1">Athletes in platform database</p>
          </div>
        </div>

        {/* Teams */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Franchises
            </span>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">
              {loading ? "..." : stats?.teams_count ?? 0}
            </span>
            <p className="text-xs text-slate-500 mt-1">Bidding team accounts</p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Live Auctions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Live Auctions
              </span>
            </div>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800">
              Real-time
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {loading ? "..." : stats?.live_auctions_count ?? 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Currently accepting live bids</p>
        </div>

        {/* Total Players Sold */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Auctioned Players
              </span>
            </div>
            <span className="text-xs text-slate-400">Completed</span>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {loading ? "..." : stats?.total_players_sold ?? 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Assigned to team rosters</p>
        </div>

        {/* Total Bidding Volume */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Bidding Volume
              </span>
            </div>
            <span className="text-xs text-slate-400">INR</span>
          </div>
          <p className="text-3xl font-black text-emerald-700">
            {loading
              ? "..."
              : `₹${(stats?.total_sales_volume ?? 0).toLocaleString("en-IN")}`}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total points / purse allocated</p>
        </div>
      </div>

      {/* Two Column Layout: Recent Tournaments & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tournaments Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Tournaments</h3>
              <p className="text-xs text-slate-500">Latest additions to the platform</p>
            </div>
            <Link
              href="/admin/tournaments"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              View All ({stats?.tournaments_count ?? 0})
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading tournaments...</div>
            ) : !stats?.recent_tournaments || stats.recent_tournaments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No tournaments created yet in the database.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Tournament</th>
                    <th className="px-4 py-3 font-semibold">Sport</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Registration Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {stats.recent_tournaments.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {t.name}
                        {t.location && (
                          <span className="block text-[11px] text-slate-400 font-normal">
                            {t.location}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {t.sport}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === "PUBLISHED"
                              ? "bg-emerald-100 text-emerald-800"
                              : t.status === "REGISTRATION_CLOSED"
                              ? "bg-amber-100 text-amber-800"
                              : t.status === "COMPLETED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Administrative Actions</h3>
            <p className="text-xs text-slate-500 mb-4">Direct shortcuts to management functions</p>

            <div className="space-y-2.5">
              <Link href="/admin/tournaments" className="block">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all group">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                        Manage Tournaments
                      </p>
                      <p className="text-[11px] text-slate-500">Edit status, dates & rules</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                </div>
              </Link>

              <Link href="/admin/organizers" className="block">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all group">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-800">
                        Verify Organizers
                      </p>
                      <p className="text-[11px] text-slate-500">Approve or suspend host accounts</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                </div>
              </Link>

              <Link href="/admin/auctions" className="block">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all group">
                  <div className="flex items-center gap-3">
                    <Radio className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                        Live Auction Monitor
                      </p>
                      <p className="text-[11px] text-slate-500">Real-time bidding supervision</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                </div>
              </Link>

              <Link href="/admin/reports" className="block">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all group">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Export System Data</p>
                      <p className="text-[11px] text-slate-500">Download CSV/JSON reports</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Audit Logs Preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Recent Audit Events</h3>
              <Link
                href="/admin/activity-logs"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Full Log
              </Link>
            </div>

            <div className="space-y-2.5">
              {!stats?.recent_activities || stats.recent_activities.length === 0 ? (
                <p className="text-xs text-slate-400">No activity logged yet.</p>
              ) : (
                stats.recent_activities.slice(0, 3).map((act: any) => (
                  <div
                    key={act.id}
                    className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 text-xs"
                  >
                    <Activity className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{act.action}</p>
                      <p className="text-[11px] text-slate-500">
                        {new Date(act.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

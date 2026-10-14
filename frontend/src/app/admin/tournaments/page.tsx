"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  Calendar,
  Users,
  MoreVertical,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface TournamentItem {
  id: string;
  name: string;
  sport: string;
  organizer_id: string;
  organizer_name?: string;
  status: string;
  registration_start_date?: string;
  registration_end_date?: string;
  auction_date?: string;
  registered_players_count?: number;
  teams_count?: number;
  created_at: string;
}

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sportFilter, setSportFilter] = useState("");

  // Action state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (sportFilter) params.append("sport", sportFilter);

      const qs = params.toString() ? `?${params.toString()}` : "";
      const data = await apiClient<TournamentItem[]>(`/admin/tournaments${qs}`);
      setTournaments(data);
    } catch (err: any) {
      setError(err.message || "Failed to load tournaments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [statusFilter, sportFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTournaments();
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setStatusChangingId(id);
      setError(null);
      await apiClient(`/admin/tournaments/${id}/status`, {
        method: "PATCH",
        data: { new_status: newStatus },
      });
      setSuccessMsg(`Tournament status changed to ${newStatus}`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchTournaments();
    } catch (err: any) {
      setError(err.message || "Failed to update tournament status");
    } finally {
      setStatusChangingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete tournament "${name}"?`)) {
      return;
    }
    try {
      setDeletingId(id);
      setError(null);
      await apiClient(`/admin/tournaments/${id}`, {
        method: "DELETE",
      });
      setSuccessMsg(`Tournament deleted successfully`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchTournaments();
    } catch (err: any) {
      setError(err.message || "Failed to delete tournament");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-emerald-600" />
            Tournament Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Global governance over all tournaments, registration windows, and lifecycle states.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchTournaments}
          disabled={loading}
          className="self-start sm:self-auto bg-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Messages */}
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tournament name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>
          <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Filter
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="REGISTRATION_CLOSED">Registration Closed</option>
            <option value="AUCTION_ACTIVE">Auction Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Sports</option>
            <option value="cricket">Cricket</option>
            <option value="football">Football</option>
            <option value="badminton">Badminton</option>
            <option value="volleyball">Volleyball</option>
            <option value="basketball">Basketball</option>
          </select>
        </div>
      </div>

      {/* Tournaments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading tournaments...</div>
          ) : tournaments.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No tournaments found matching criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Tournament</th>
                  <th className="px-4 py-3.5 font-semibold">Sport</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 font-semibold">Players / Teams</th>
                  <th className="px-4 py-3.5 font-semibold">Created Date</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tournaments.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        ID: {t.id}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {t.sport}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === "PUBLISHED"
                            ? "bg-emerald-100 text-emerald-800"
                            : t.status === "REGISTRATION_CLOSED"
                            ? "bg-amber-100 text-amber-800"
                            : t.status === "AUCTION_ACTIVE"
                            ? "bg-purple-100 text-purple-800 animate-pulse"
                            : t.status === "COMPLETED"
                            ? "bg-blue-100 text-blue-800"
                            : t.status === "CANCELLED"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.registered_players_count ?? 0} Players</span>
                        <span className="text-slate-300">/</span>
                        <span>{t.teams_count ?? 0} Teams</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-500 font-mono text-[11px]">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString() : "-"}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Status Change Selector */}
                        <select
                          disabled={statusChangingId === t.id}
                          value={t.status}
                          onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                          className="text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                        >
                          <option value="DRAFT">DRAFT</option>
                          <option value="PUBLISHED">PUBLISHED</option>
                          <option value="REGISTRATION_CLOSED">REGISTRATION_CLOSED</option>
                          <option value="AUCTION_ACTIVE">AUCTION_ACTIVE</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>

                        {/* View Tournament Link */}
                        <Link
                          href={`/tournament/${t.id}`}
                          target="_blank"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-emerald-700 transition-colors"
                          title="View public tournament page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {/* Delete Button */}
                        <button
                          disabled={deletingId === t.id}
                          onClick={() => handleDelete(t.id, t.name)}
                          className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete tournament"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

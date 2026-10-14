"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  Trophy,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface PlayerItem {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  account_status: string;
  registrations_count: number;
  created_at: string;
}

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<PlayerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient<PlayerItem[]>("/admin/players");
      setPlayers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load players");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    try {
      setUpdatingId(userId);
      setError(null);
      await apiClient(`/admin/players/${userId}/status`, {
        method: "PATCH",
        data: { new_status: newStatus },
      });
      setSuccessMsg(`Player status updated to ${newStatus}`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchPlayers();
    } catch (err: any) {
      setError(err.message || "Failed to update player status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredPlayers = players.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.phone_number?.toLowerCase().includes(term)
    );
  });

  const activeCount = players.filter((p) => p.account_status === "ACTIVE").length;
  const suspendedCount = players.filter((p) => p.account_status === "SUSPENDED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Player Directory & Athlete Profiles
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registered athletes across all multi-sport tournaments, auctions, and team rosters.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchPlayers}
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

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold uppercase">Total Athletes</span>
          <p className="text-xl font-black text-slate-900 mt-1">{players.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-emerald-600 font-semibold uppercase">Active Athletes</span>
          <p className="text-xl font-black text-emerald-700 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-red-600 font-semibold uppercase">Suspended</span>
          <p className="text-xl font-black text-red-700 mt-1">{suspendedCount}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search player name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading players...</div>
          ) : filteredPlayers.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No players found in the database.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Athlete Name</th>
                  <th className="px-4 py-3.5 font-semibold">Contact</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 font-semibold">Tournament Entries</th>
                  <th className="px-4 py-3.5 font-semibold">Registration Date</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPlayers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm">{p.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: {p.id}</div>
                    </td>

                    <td className="px-4 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{p.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{p.phone_number || "N/A"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.account_status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {p.account_status}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-semibold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        {p.registrations_count} Tournaments
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-500 font-mono text-[11px]">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : "-"}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {p.account_status === "ACTIVE" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === p.id}
                          onClick={() => handleUpdateStatus(p.id, "SUSPENDED")}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 text-[11px] h-7 px-2.5"
                        >
                          Suspend Player
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={updatingId === p.id}
                          onClick={() => handleUpdateStatus(p.id, "ACTIVE")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2.5"
                        >
                          Activate Player
                        </Button>
                      )}
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

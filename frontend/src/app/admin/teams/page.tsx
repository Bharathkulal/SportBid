"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Edit2,
  DollarSign,
  Users,
  Trophy,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface TeamItem {
  id: string;
  name: string;
  short_code?: string;
  tournament_id: string;
  tournament_name?: string;
  initial_budget: number;
  remaining_budget: number;
  players_acquired_count: number;
  created_at: string;
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Modal edit budget state
  const [editingTeam, setEditingTeam] = useState<TeamItem | null>(null);
  const [newBudgetVal, setNewBudgetVal] = useState<number>(0);
  const [savingBudget, setSavingBudget] = useState(false);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient<TeamItem[]>("/admin/teams");
      setTeams(data);
    } catch (err: any) {
      setError(err.message || "Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleOpenEdit = (team: TeamItem) => {
    setEditingTeam(team);
    setNewBudgetVal(team.remaining_budget ?? team.initial_budget);
  };

  const handleSaveBudget = async () => {
    if (!editingTeam) return;
    try {
      setSavingBudget(true);
      setError(null);
      await apiClient(`/admin/teams/${editingTeam.id}/budget`, {
        method: "PATCH",
        data: { new_budget: Number(newBudgetVal) },
      });
      setSuccessMsg(`Budget updated for ${editingTeam.name}`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setEditingTeam(null);
      await fetchTeams();
    } catch (err: any) {
      setError(err.message || "Failed to update team budget");
    } finally {
      setSavingBudget(false);
    }
  };

  const filteredTeams = teams.filter((t) => {
    const term = search.toLowerCase();
    return (
      t.name?.toLowerCase().includes(term) ||
      t.short_code?.toLowerCase().includes(term) ||
      t.tournament_name?.toLowerCase().includes(term)
    );
  });

  const totalPurse = teams.reduce((acc, t) => acc + (t.initial_budget || 0), 0);
  const totalSpent = teams.reduce(
    (acc, t) => acc + Math.max(0, (t.initial_budget || 0) - (t.remaining_budget || 0)),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            Team Franchises & Auction Purses
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track registered auction franchises, remaining purse balances, and squad sizes.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchTeams}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold uppercase">Total Franchises</span>
          <p className="text-xl font-black text-slate-900 mt-1">{teams.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-emerald-600 font-semibold uppercase">Total Allocated Purse</span>
          <p className="text-xl font-black text-emerald-700 mt-1">
            ₹{totalPurse.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-blue-600 font-semibold uppercase">Purse Utilized</span>
          <p className="text-xl font-black text-blue-700 mt-1">
            ₹{totalSpent.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by team name, code, or tournament..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
        </div>
      </div>

      {/* Teams Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading teams...</div>
          ) : filteredTeams.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No teams found in the database.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Franchise</th>
                  <th className="px-4 py-3.5 font-semibold">Tournament</th>
                  <th className="px-4 py-3.5 font-semibold">Initial Budget</th>
                  <th className="px-4 py-3.5 font-semibold">Remaining Purse</th>
                  <th className="px-4 py-3.5 font-semibold">Squad Count</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Budget Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>{team.name}</span>
                        {team.short_code && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                            {team.short_code}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: {team.id}</div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{team.tournament_name || "Unassigned"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 font-mono font-medium text-slate-700">
                      ₹{(team.initial_budget || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-mono font-bold text-emerald-700 text-xs">
                        ₹{(team.remaining_budget ?? team.initial_budget ?? 0).toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <Users className="w-3 h-3 text-slate-400" />
                        {team.players_acquired_count ?? 0} Players
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(team)}
                        className="text-xs text-slate-700 hover:text-emerald-700 hover:border-emerald-300 h-7 px-2.5"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Adjust Budget
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Budget Modal */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Adjust Team Purse Budget
              </h3>
              <button
                onClick={() => setEditingTeam(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Franchise</p>
                <p className="font-bold text-slate-900 mt-0.5">{editingTeam.name}</p>
                <p className="text-xs text-slate-400">
                  Current Balance: ₹
                  {(editingTeam.remaining_budget ?? editingTeam.initial_budget).toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Remaining Budget (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={newBudgetVal}
                  onChange={(e) => setNewBudgetVal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Adjusting this changes the franchise's real-time bidding limit during live auctions.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingTeam(null)}
                disabled={savingBudget}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveBudget}
                disabled={savingBudget}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {savingBudget ? "Saving..." : "Save Budget"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

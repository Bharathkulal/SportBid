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
  Download,
  Eye,
  X,
  Images,
  Gavel,
  Phone,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { apiClient, API_BASE_URL, getFullStorageUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Registration } from "@/lib/tournament-types";
import { PlayerAuctionPoster } from "@/components/poster/PlayerAuctionPoster";

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

  // Posters & Registrations Modal State
  const [selectedTournament, setSelectedTournament] = useState<TournamentItem | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState<boolean>(false);
  const [downloadingZip, setDownloadingZip] = useState<boolean>(false);
  const [previewPosterReg, setPreviewPosterReg] = useState<Registration | null>(null);

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

  const handleOpenPostersModal = async (t: TournamentItem) => {
    setSelectedTournament(t);
    setLoadingRegs(true);
    try {
      const data = await apiClient<Registration[]>(`/tournaments/${t.id}/registrations`);
      setRegistrations(data);
    } catch (err: any) {
      alert(`Failed to load registrations: ${err.message}`);
    } finally {
      setLoadingRegs(false);
    }
  };

  const handleDownloadZip = async (tourneyId: string, tourneyName: string) => {
    try {
      setDownloadingZip(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API_BASE_URL}/tournaments/${tourneyId}/posters/zip`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to download posters ZIP archive.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tourneyName.replace(/\s+/g, "_")}_posters.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Could not download ZIP archive");
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleDownloadPoster = async (reg: Registration) => {
    try {
      if (reg.poster_url) {
        const fullUrl = getFullStorageUrl(reg.poster_url);
        const res = await fetch(fullUrl);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${reg.serial_str || "01"}_${reg.player_name.replace(/\s+/g, "_")}_poster.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Poster is still rendering. Please check back shortly.");
      }
    } catch (e) {
      if (reg.poster_url) window.open(reg.poster_url, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-emerald-600" />
            Tournament Management & Auction Control
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Global directory of all organized tournaments, player registrations, and generated auction posters.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchTournaments}
          disabled={loading}
          className="self-start sm:self-auto border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or sport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="REGISTRATION_CLOSED">REGISTRATION_CLOSED</option>
            <option value="AUCTION_ACTIVE">AUCTION_ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            <option value="">All Sports</option>
            <option value="volleyball">Volleyball</option>
            <option value="cricket">Cricket</option>
            <option value="football">Football</option>
            <option value="kabaddi">Kabaddi</option>
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
                  <th className="px-4 py-3.5 font-semibold">Registered Players</th>
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
                        {/* Posters & Registrations Modal Trigger */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenPostersModal(t)}
                          className="bg-yellow-50 hover:bg-yellow-100 text-yellow-900 border-yellow-300 text-[11px] h-7 px-2 font-bold"
                          title="View all registered players and match posters"
                        >
                          <Images className="w-3.5 h-3.5 mr-1 text-yellow-600" />
                          Posters ({t.registered_players_count ?? 0})
                        </Button>

                        {/* Live Auction Arena Link */}
                        <Link
                          href={`/auction/${t.id}`}
                          target="_blank"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-purple-700 transition-colors"
                          title="Open Live Auction Arena"
                        >
                          <Gavel className="w-4 h-4 text-purple-600" />
                        </Link>

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

      {/* ------------------------------------------------------------------ */}
      {/* POSTERS & REGISTRATIONS MODAL FOR SUPER ADMIN                     */}
      {/* ------------------------------------------------------------------ */}
      {selectedTournament && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400 text-slate-950 font-black flex items-center justify-center shadow-xs">
                  <Images className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>{selectedTournament.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold uppercase">
                      {selectedTournament.sport}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official tournament registrations & high-resolution downloadable match posters
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Download All Posters (ZIP) */}
                <Button
                  size="sm"
                  onClick={() => handleDownloadZip(selectedTournament.id, selectedTournament.name)}
                  disabled={downloadingZip || registrations.length === 0}
                  className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  {downloadingZip ? "Preparing ZIP..." : `Download All Posters (${registrations.length})`}
                </Button>

                <button
                  onClick={() => setSelectedTournament(null)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingRegs ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  Loading registered athletes and poster assets...
                </div>
              ) : registrations.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No players registered for this tournament yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {registrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-yellow-400 hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        {/* Player Photo */}
                        <div className="w-16 h-16 rounded-xl bg-slate-900 border-2 border-yellow-400 overflow-hidden shrink-0 flex items-center justify-center">
                          {reg.player_photo_url ? (
                            <img
                              src={reg.player_photo_url}
                              alt={reg.player_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-mono font-bold text-yellow-400">
                              #{reg.serial_str || "01"}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-yellow-400 text-slate-950 font-mono font-black text-xs">
                              #{reg.serial_str || "01"}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold uppercase">
                              {reg.role || "PLAYER"}
                            </span>
                          </div>

                          <h4 className="font-bold text-slate-900 text-sm mt-1 uppercase truncate">
                            {reg.player_name}
                          </h4>

                          <div className="text-xs text-slate-500 space-y-0.5 mt-1">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{reg.village || "KOKARNE"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{reg.player_phone}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Poster Action Bar */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {reg.registration_number}
                        </span>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewPosterReg(reg)}
                            className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-7 px-2.5"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                            Preview Slide
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleDownloadPoster(reg)}
                            className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold text-xs h-7 px-2.5"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            PNG
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* FULL-RES POSTER PREVIEW MODAL                                      */}
      {/* ------------------------------------------------------------------ */}
      {previewPosterReg && selectedTournament && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-4xl w-full flex flex-col items-center">
            <div className="w-full flex justify-end mb-2">
              <button
                onClick={() => setPreviewPosterReg(null)}
                className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <PlayerAuctionPoster
              playerName={previewPosterReg.player_name}
              serialStr={previewPosterReg.serial_str || "01"}
              village={previewPosterReg.village || "KOKARNE"}
              role={previewPosterReg.role || "BLOCKER"}
              phone={previewPosterReg.player_phone}
              photoUrl={previewPosterReg.player_photo_url || undefined}
              posterUrl={previewPosterReg.poster_url || undefined}
              sport={selectedTournament.sport}
              tournamentTitle={selectedTournament.name}
              showActions={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

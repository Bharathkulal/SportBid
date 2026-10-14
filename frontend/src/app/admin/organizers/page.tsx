"use client";

import { useEffect, useState } from "react";
import {
  UserCheck,
  Search,
  RefreshCw,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  Building2,
  Calendar,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface OrganizerItem {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  organization_name?: string;
  account_status: string;
  tournaments_count: number;
  created_at: string;
}

export default function AdminOrganizersPage() {
  const [organizers, setOrganizers] = useState<OrganizerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient<OrganizerItem[]>("/admin/organizers");
      setOrganizers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load organizers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    try {
      setUpdatingId(userId);
      setError(null);
      await apiClient(`/admin/organizers/${userId}/status`, {
        method: "PATCH",
        data: { new_status: newStatus },
      });
      setSuccessMsg(`Organizer status updated to ${newStatus}`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchOrganizers();
    } catch (err: any) {
      setError(err.message || "Failed to update organizer status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrganizers = organizers.filter((org) => {
    const term = search.toLowerCase();
    return (
      org.full_name?.toLowerCase().includes(term) ||
      org.email?.toLowerCase().includes(term) ||
      org.organization_name?.toLowerCase().includes(term)
    );
  });

  const activeCount = organizers.filter((o) => o.account_status === "ACTIVE").length;
  const pendingCount = organizers.filter(
    (o) => o.account_status === "PENDING_VERIFICATION"
  ).length;
  const suspendedCount = organizers.filter((o) => o.account_status === "SUSPENDED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            Organizer Verification & Governance
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review host credentials, verify organizations, and manage platform hosting privileges.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrganizers}
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

      {/* KPI mini-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold uppercase">Total Organizers</span>
          <p className="text-xl font-black text-slate-900 mt-1">{organizers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-emerald-600 font-semibold uppercase">Active Hosts</span>
          <p className="text-xl font-black text-emerald-700 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-amber-600 font-semibold uppercase">Pending Verification</span>
          <p className="text-xl font-black text-amber-700 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-red-600 font-semibold uppercase">Suspended</span>
          <p className="text-xl font-black text-red-700 mt-1">{suspendedCount}</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
        </div>
      </div>

      {/* Organizers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading organizers...</div>
          ) : filteredOrganizers.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No organizers found in the database.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Organizer / Org</th>
                  <th className="px-4 py-3.5 font-semibold">Contact Info</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 font-semibold">Tournaments</th>
                  <th className="px-4 py-3.5 font-semibold">Joined Date</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Verification Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrganizers.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm">{org.full_name}</div>
                      {org.organization_name ? (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{org.organization_name}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Individual Host</span>
                      )}
                    </td>

                    <td className="px-4 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{org.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{org.phone_number || "N/A"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          org.account_status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : org.account_status === "PENDING_VERIFICATION"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {org.account_status}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-semibold text-slate-800">
                      {org.tournaments_count} Created
                    </td>

                    <td className="px-4 py-4 text-slate-500 font-mono text-[11px]">
                      {org.created_at ? new Date(org.created_at).toLocaleDateString() : "-"}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {org.account_status !== "ACTIVE" && (
                          <Button
                            size="sm"
                            disabled={updatingId === org.id}
                            onClick={() => handleUpdateStatus(org.id, "ACTIVE")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2.5"
                          >
                            Verify & Activate
                          </Button>
                        )}

                        {org.account_status !== "SUSPENDED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingId === org.id}
                            onClick={() => handleUpdateStatus(org.id, "SUSPENDED")}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 text-[11px] h-7 px-2.5"
                          >
                            Suspend
                          </Button>
                        )}

                        {org.account_status === "ACTIVE" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={updatingId === org.id}
                            onClick={() => handleUpdateStatus(org.id, "PENDING_VERIFICATION")}
                            className="text-amber-700 hover:bg-amber-50 text-[11px] h-7 px-2"
                          >
                            Set Pending
                          </Button>
                        )}
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

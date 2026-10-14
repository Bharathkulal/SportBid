"use client";

import { useEffect, useState } from "react";
import {
  History,
  Search,
  RefreshCw,
  AlertCircle,
  Shield,
  Activity,
  Clock,
  User,
  Filter,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface ActivityLogItem {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, any>;
  timestamp: string;
}

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(50);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient<ActivityLogItem[]>(
        `/admin/activity-logs?limit=${limit}`
      );
      setLogs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [limit]);

  const filteredLogs = logs.filter((l) => {
    const term = search.toLowerCase();
    return (
      l.action?.toLowerCase().includes(term) ||
      l.admin_email?.toLowerCase().includes(term) ||
      l.target_type?.toLowerCase().includes(term) ||
      l.target_id?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-600" />
            Audit & Administrative Activity Logs
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable audit record of all super administrator actions, status overrides, and system alterations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
          >
            <option value={25}>Show 25</option>
            <option value={50}>Show 50</option>
            <option value={100}>Show 100</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action keyword, admin email, or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
        </div>
      </div>

      {/* Logs Table / Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading activity logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No activity logs recorded yet. System modifications will be automatically audited here.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Action & Target</th>
                  <th className="px-4 py-3.5 font-semibold">Admin Account</th>
                  <th className="px-4 py-3.5 font-semibold">Audit Details</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                        <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{log.action}</span>
                      </div>
                      {log.target_type && (
                        <div className="text-[11px] text-slate-400 font-mono mt-1">
                          Target: {log.target_type} ({log.target_id || "N/A"})
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.admin_email || "System"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <div className="p-2 rounded bg-slate-50 border border-slate-200/80 font-mono text-[11px] text-slate-700 max-w-sm truncate">
                          {JSON.stringify(log.details)}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-slate-500 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {log.timestamp
                            ? new Date(log.timestamp).toLocaleString()
                            : "Just now"}
                        </span>
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

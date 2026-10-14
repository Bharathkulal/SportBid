"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  FileJson,
  FileText,
  AlertCircle,
  CheckCircle,
  Database,
  Trophy,
  UserCheck,
  Users,
  Shield,
  Loader2,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function AdminReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);

  const handleDownload = async (type: string, format: "json" | "csv") => {
    try {
      setDownloading(`${type}-${format}`);
      setError(null);
      const data = await apiClient<any[]>(`/admin/reports/export?type=${type}`);

      if (!data || data.length === 0) {
        setError(`No ${type} records available to export.`);
        return;
      }

      setPreviewData(data);
      setPreviewType(type);

      if (format === "json") {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(data, null, 2)
        )}`;
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute("download", `sportbid_${type}_report_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      } else {
        // Convert to CSV
        const headers = Object.keys(data[0]);
        const csvRows = [];
        csvRows.push(headers.join(","));

        for (const row of data) {
          const values = headers.map((header) => {
            const val = row[header];
            if (val === null || val === undefined) return '""';
            const escaped = ("" + val).replace(/"/g, '""');
            return `"${escaped}"`;
          });
          csvRows.push(values.join(","));
        }

        const csvString = `data:text/csv;charset=utf-8,${encodeURIComponent(
          csvRows.join("\n")
        )}`;
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", csvString);
        downloadAnchor.setAttribute("download", `sportbid_${type}_report_${Date.now()}.csv`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }

      setSuccessMsg(`Successfully generated and downloaded ${type} ${format.toUpperCase()} export.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to export report");
    } finally {
      setDownloading(null);
    }
  };

  const REPORT_CARDS = [
    {
      type: "tournaments",
      title: "Tournaments Report",
      description: "Complete list of tournaments, lifecycle states, dates, and team counts.",
      icon: Trophy,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      type: "organizers",
      title: "Organizers & Hosts Report",
      description: "Host profiles, organization names, contact details, and verification statuses.",
      icon: UserCheck,
      color: "text-blue-600 bg-blue-50",
    },
    {
      type: "players",
      title: "Athletes Directory Report",
      description: "All registered players, email, phone numbers, and tournament registrations.",
      icon: Users,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      type: "teams",
      title: "Team Franchises & Purses",
      description: "Franchise names, assigned tournaments, initial budgets, and remaining balances.",
      icon: Shield,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            Reports & Data Exports
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Export real MongoDB platform collections to CSV and JSON formats for audits and analysis.
          </p>
        </div>
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

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_CARDS.map((card) => {
          const Icon = card.icon;
          const isDownloadingJson = downloading === `${card.type}-json`;
          const isDownloadingCsv = downloading === `${card.type}-csv`;

          return (
            <div
              key={card.type}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-emerald-300 transition-all"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{card.title}</h3>
                    <span className="text-[11px] font-mono text-slate-400 uppercase">
                      Collection: {card.type}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{card.description}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!downloading}
                  onClick={() => handleDownload(card.type, "csv")}
                  className="flex-1 text-xs border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  {isDownloadingCsv ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  )}
                  Export CSV
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!downloading}
                  onClick={() => handleDownload(card.type, "json")}
                  className="flex-1 text-xs border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  {isDownloadingJson ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <FileJson className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  )}
                  Export JSON
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Data Preview Section */}
      {previewData && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm capitalize">
              Recent Export Preview: {previewType} ({previewData.length} Records)
            </h3>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Ready for Download
            </span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
                <tr>
                  {Object.keys(previewData[0] || {}).map((col) => (
                    <th key={col} className="px-4 py-3 font-semibold uppercase text-[10px]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                {previewData.slice(0, 15).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    {Object.values(row).map((val: any, cIdx) => (
                      <td key={cIdx} className="px-4 py-2.5 max-w-xs truncate">
                        {val === null || val === undefined ? "-" : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

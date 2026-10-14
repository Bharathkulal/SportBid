"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Server,
  Globe,
  Bell,
  Sliders,
  Database,
  Lock,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface SystemSettings {
  platform_name: string;
  support_email: string;
  maintenance_mode: boolean;
  allow_new_registrations: boolean;
  default_currency: string;
  max_poster_upload_mb: number;
  auto_approval_enabled: boolean;
  banner_announcement?: string;
  updated_at?: string;
  updated_by?: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    platform_name: "SportBid",
    support_email: "support@sportbid.com",
    maintenance_mode: false,
    allow_new_registrations: true,
    default_currency: "INR",
    max_poster_upload_mb: 10,
    auto_approval_enabled: false,
    banner_announcement: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient<SystemSettings>("/admin/settings");
      setSettings(data);
    } catch (err: any) {
      setError(err.message || "Failed to load system settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await apiClient("/admin/settings", {
        method: "PATCH",
        data: settings,
      });
      setSuccessMsg("System configuration successfully saved to MongoDB.");
      setTimeout(() => setSuccessMsg(null), 3500);
      await fetchSettings();
    } catch (err: any) {
      setError(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            Global Platform Settings & Governance
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure system variables, registration toggles, media constraints, and announcements.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchSettings}
          disabled={loading || saving}
          className="self-start sm:self-auto bg-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
          Reset Form
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Platform Config */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Globe className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">General Platform Variables</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.platform_name || ""}
                onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Support & Contact Email
              </label>
              <input
                type="email"
                value={settings.support_email || ""}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Currency Code
              </label>
              <select
                value={settings.default_currency || "INR"}
                onChange={(e) => setSettings({ ...settings, default_currency: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 font-semibold"
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Poster / Asset Upload (MB)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.max_poster_upload_mb || 10}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    max_poster_upload_mb: parseInt(e.target.value) || 10,
                  })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Global Platform Announcement Banner
            </label>
            <input
              type="text"
              placeholder="e.g. Scheduled system upgrade this Sunday 2 AM IST"
              value={settings.banner_announcement || ""}
              onChange={(e) => setSettings({ ...settings, banner_announcement: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>
        </div>

        {/* Feature Switches & Toggles */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Security & Access Toggles</h3>
          </div>

          <div className="space-y-3">
            {/* Maintenance Mode */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-900">Maintenance Mode</p>
                <p className="text-[11px] text-slate-500">
                  Restrict platform access for players and organizers during database maintenance
                </p>
              </div>
              <input
                type="checkbox"
                checked={!!settings.maintenance_mode}
                onChange={(e) =>
                  setSettings({ ...settings, maintenance_mode: e.target.checked })
                }
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            {/* Allow Registrations */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-900">Allow New User Registrations</p>
                <p className="text-[11px] text-slate-500">
                  Permit new players and organizers to create accounts
                </p>
              </div>
              <input
                type="checkbox"
                checked={!!settings.allow_new_registrations}
                onChange={(e) =>
                  setSettings({ ...settings, allow_new_registrations: e.target.checked })
                }
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            {/* Auto Approval */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-900">Auto-Approve Organizer Accounts</p>
                <p className="text-[11px] text-slate-500">
                  Instantly verify organizers upon signup without manual admin confirmation
                </p>
              </div>
              <input
                type="checkbox"
                checked={!!settings.auto_approval_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, auto_approval_enabled: e.target.checked })
                }
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* System Architecture Metadata Card */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-slate-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Environment Architecture Reference
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 mt-3 font-mono">
            <div className="p-2.5 bg-white rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block">DATABASE</span>
              <span className="font-bold text-emerald-700">MongoDB Atlas Cluster</span>
            </div>
            <div className="p-2.5 bg-white rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block">SESSION SECURITY</span>
              <span className="font-bold text-blue-700">Argon2id + HttpOnly</span>
            </div>
            <div className="p-2.5 bg-white rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block">AUCTION ENGINE</span>
              <span className="font-bold text-purple-700">Deterministic WebSocket</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving Changes..." : "Save System Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}

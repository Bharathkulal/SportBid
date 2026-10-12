"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import {
  ShieldAlert,
  Users,
  Database,
  Activity,
  AlertCircle,
  Settings,
} from "lucide-react";

export default function SuperAdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [adminData, setAdminData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user && user.role !== "SUPER_ADMIN") {
      router.push(user.role === "PLAYER" ? "/dashboard/player" : "/dashboard/organizer");
    } else if (user) {
      apiClient<any>("/dashboard/admin")
        .then(setAdminData)
        .catch((err) => setError(err.message));
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-slate-400">
        Verifying Administrative Privileges...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="blue">Root Authority</Badge>
              <span className="text-xs text-slate-400 font-mono">SUPER_ADMIN</span>
            </div>
            <h1 className="text-3xl font-black uppercase text-white tracking-tight">
              Platform Governance: <span className="text-blue-400">{user.full_name}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Global system monitoring, organizer verification, and audit logs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm">
              <Settings className="w-4 h-4 mr-1.5" />
              Global Settings
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Admin Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-[#11141c] border border-slate-800 sports-card-glow">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              Administrator Profile
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-500 uppercase">Account</span>
                <p className="font-semibold text-white">{user.full_name}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase">Root Email</span>
                <p className="font-semibold text-slate-200">{user.email}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase">Authority Level</span>
                <p className="font-semibold text-blue-400">{user.role}</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#11141c] border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-3">
                <Database className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">ONLINE</div>
              <div className="text-xs font-semibold uppercase text-slate-400 mt-1">
                MongoDB Atlas Cluster
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Replica set connected with active pooling.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#11141c] border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-3">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-white">HEALTHY</div>
              <div className="text-xs font-semibold uppercase text-slate-400 mt-1">
                FastAPI Gateway
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Session-based cryptographic authentication active.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

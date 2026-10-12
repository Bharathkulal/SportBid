"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import {
  Building2,
  Users,
  Trophy,
  ShieldCheck,
  PlusCircle,
  AlertCircle,
  Layers,
} from "lucide-react";

export default function OrganizerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user && user.role !== "ORGANIZER") {
      router.push(user.role === "PLAYER" ? "/dashboard/player" : "/dashboard/admin");
    } else if (user) {
      apiClient<any>("/dashboard/organizer")
        .then(setDashboardData)
        .catch((err) => setError(err.message));
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-slate-400">
        Verifying Organizer Authority...
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
              <Badge variant="green">Organizer Command Center</Badge>
              <span className="text-xs text-slate-400 font-mono">ID: {user.id}</span>
            </div>
            <h1 className="text-3xl font-black uppercase text-white tracking-tight">
              Console: <span className="text-emerald-400">{user.full_name}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Tournament coordination, player roster reviews, and match poster publication
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="accent" size="sm">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Create Tournament
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Organizer Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-[#11141c] border border-slate-800 sports-card-glow">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              Organizer Entity Info
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-500 uppercase">Contact Name</span>
                <p className="font-semibold text-white">{user.full_name}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase">Contact Email</span>
                <p className="font-semibold text-slate-200">{user.email}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase">Phone</span>
                <p className="font-semibold text-slate-200">{user.phone_number}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase">Role</span>
                <p className="font-semibold text-emerald-400">{user.role}</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#11141c] border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3">
                <Trophy className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">0</div>
              <div className="text-xs font-semibold uppercase text-slate-400 mt-1">
                Managed Tournaments
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Phase 2 tournament creation and custom fields engine.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#11141c] border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-orange-400" />
              </div>
              <div className="text-2xl font-black text-white">0</div>
              <div className="text-xs font-semibold uppercase text-slate-400 mt-1">
                Pending Registration Approvals
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Player verification and poster publishing gates.
            </p>
          </div>
        </div>

        {/* Empty State Card */}
        <div className="p-8 rounded-2xl bg-[#11141c] border border-slate-800 text-center">
          <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white uppercase">No Tournaments Created Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            You haven't launched any sports leagues or tournaments. In Phase 2, you'll be able to configure sport registration rules, set deadlines, and automatically generate professional matchday posters.
          </p>
          <Button variant="outline" size="sm">
            Review Platform Guidelines
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

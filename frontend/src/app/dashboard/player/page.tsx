"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import { Registration } from "@/lib/tournament-types";
import {
  Trophy,
  Calendar,
  FileImage,
  AlertCircle,
  Clock,
  ArrowRight,
  Download,
} from "lucide-react";

export default function PlayerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user && user.role !== "PLAYER") {
      router.push(user.role === "ORGANIZER" ? "/dashboard/organizer" : "/dashboard/admin");
    } else if (user) {
      setFetching(true);
      apiClient<Registration[]>("/tournaments/player/my-registrations")
        .then(setRegistrations)
        .catch((err) => setError(err.message))
        .finally(() => setFetching(false));
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-slate-400">
        Authenticating Player Arena...
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
              <Badge variant="orange">Athlete Arena</Badge>
              <span className="text-xs text-slate-400 font-mono">ID: {user.id}</span>
            </div>
            <h1 className="text-3xl font-black uppercase text-white tracking-tight">
              Welcome, <span className="text-orange-500">{user.full_name}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Active sports profile and generated matchday posters
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/tournaments">
              <Button variant="primary" size="sm">
                Browse Tournaments
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Profile Card & Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-[#11141c] border border-slate-800 sports-card-glow">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              Verified Athlete Identity
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-500 uppercase">Full Name</span>
                <p className="font-semibold text-white">{user.full_name}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase">Email</span>
                <p className="font-semibold text-slate-200">{user.email}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase">Contact Phone</span>
                <p className="font-semibold text-slate-200">{user.phone_number}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase">Account Status</span>
                <p className="font-semibold text-emerald-400">{user.account_status}</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#11141c] border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-3">
                <Trophy className="w-5 h-5 text-orange-400" />
              </div>
              <div className="text-2xl font-black text-white">{registrations.length}</div>
              <div className="text-xs font-semibold uppercase text-slate-400 mt-1">
                Active Tournament Registrations
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Permanent player registrations saved in MongoDB.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#11141c] border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3">
                <FileImage className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">
                {registrations.filter((r) => r.status === "APPROVED").length}
              </div>
              <div className="text-xs font-semibold uppercase text-slate-400 mt-1">
                Approved Match Posters
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Rendered via deterministic Pillow engine.
            </p>
          </div>
        </div>

        {/* Player Registrations and Posters Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold uppercase text-white tracking-wide mb-4">
            My Registered Events & Posters
          </h2>

          {fetching ? (
            <div className="text-center py-12 text-slate-500">Loading registrations...</div>
          ) : registrations.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#11141c] border border-slate-800 text-center">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white uppercase">No Active Registrations</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
                You haven't registered for any sports tournaments yet. Find upcoming volleyball, cricket, or football events to create your official matchday poster.
              </p>
              <Link href="/tournaments">
                <Button variant="outline" size="sm">
                  View Tournaments
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registrations.map((reg) => (
                <div
                  key={reg.id}
                  className="rounded-2xl bg-[#11141c] border border-slate-800 overflow-hidden sports-card-glow flex flex-col justify-between"
                >
                  <div>
                    {/* Poster Preview */}
                    <div className="relative aspect-[4/5] bg-slate-900 border-b border-slate-800 flex items-center justify-center overflow-hidden">
                      {reg.poster_url ? (
                        <img
                          src={reg.poster_url}
                          alt="Poster"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <FileImage className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                          <span className="text-xs text-slate-400">Rendering Poster...</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge
                          variant={
                            reg.status === "APPROVED"
                              ? "green"
                              : reg.status === "REJECTED"
                              ? "blue"
                              : "orange"
                          }
                        >
                          {reg.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-orange-400">
                          {reg.registration_number}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(reg.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {reg.rejection_reason && (
                        <p className="text-xs text-red-400 italic mb-2">
                          Feedback: {reg.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {reg.poster_url && (
                    <div className="p-5 pt-0">
                      <a href={reg.poster_url} target="_blank" rel="noreferrer" className="block">
                        <Button variant="secondary" size="sm" className="w-full">
                          <Download className="w-3.5 h-3.5 mr-1" />
                          Download Match Poster
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

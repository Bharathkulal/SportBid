"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import { Tournament } from "@/lib/tournament-types";
import {
  Trophy,
  Users,
  PlusCircle,
  Share2,
  ExternalLink,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function OrganizerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTournaments = async () => {
    try {
      setFetching(true);
      const res = await apiClient<Tournament[]>("/tournaments/organizer/mine");
      setTournaments(res);
    } catch (err: any) {
      setError(err.message || "Failed to load tournaments.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user && user.role !== "ORGANIZER") {
      router.push(user.role === "PLAYER" ? "/dashboard/player" : "/dashboard/admin");
    } else if (user) {
      loadTournaments();
    }
  }, [user, loading, router]);

  const togglePublish = async (tournamentId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "PUBLISHED" ? "REGISTRATION_CLOSED" : "PUBLISHED";
      await apiClient(`/tournaments/${tournamentId}`, {
        method: "PATCH",
        data: { status: nextStatus },
      });
      loadTournaments();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const shareWhatsApp = async (t: Tournament) => {
    if (typeof window !== "undefined") {
      if (t.status === "DRAFT") {
        const shouldPublish = confirm(
          `"${t.title}" is currently in DRAFT (registrations closed).\n\nDo you want to Publish it now so athletes can register when they open your WhatsApp link?`
        );
        if (shouldPublish) {
          await togglePublish(t.id, t.status);
        }
      }
      const url = `${window.location.origin}/tournament/${t.id}/register`;
      const text = encodeURIComponent(
        `🏆 Registrations are open for ${t.title}! Register and get your official matchday poster here:\n${url}`
      );
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    }
  };

  const copyUrl = async (t: Tournament) => {
    if (typeof window !== "undefined") {
      if (t.status === "DRAFT") {
        const shouldPublish = confirm(
          `"${t.title}" is currently in DRAFT (registrations closed).\n\nDo you want to Publish it now so athletes can register when they open this link?`
        );
        if (shouldPublish) {
          await togglePublish(t.id, t.status);
        }
      }
      const url = `${window.location.origin}/tournament/${t.id}/register`;
      navigator.clipboard.writeText(url);
      alert("Registration link copied to clipboard!");
    }
  };

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
              <Badge variant="green">Organizer Console</Badge>
              <span className="text-xs text-slate-400 font-mono">ID: {user.id}</span>
            </div>
            <h1 className="text-3xl font-black uppercase text-white tracking-tight">
              Console: <span className="text-emerald-400">{user.full_name}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage tournaments, approve player posters, and copy registration links
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/organizer/tournaments/create">
              <Button variant="accent" size="sm">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Launch New Tournament
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

        {fetching ? (
          <div className="text-center py-20 text-slate-500">Loading tournaments...</div>
        ) : tournaments.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#11141c] border border-slate-800 text-center max-w-lg mx-auto">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white uppercase">No Tournaments Launched</h3>
            <p className="text-xs text-slate-400 mt-2 mb-6">
              Create your first Volleyball, Cricket, or custom tournament to start accepting player registrations and rendering posters.
            </p>
            <Link href="/dashboard/organizer/tournaments/create">
              <Button variant="accent" size="sm">
                Create First Tournament
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl bg-[#11141c] border border-slate-800 p-6 flex flex-col justify-between sports-card-glow group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={t.sport === "VOLLEYBALL" ? "orange" : "green"}>
                      {t.sport}
                    </Badge>
                    <Badge variant={t.status === "PUBLISHED" ? "green" : "slate"}>
                      {t.status}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold text-white line-clamp-1 mb-1">{t.title}</h3>
                  <div className="text-xs text-slate-400 mb-4">{t.venue}, {t.city}</div>

                  <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Registrations:</span>
                      <strong className="text-white">{t.total_registrations} Total ({t.approved_registrations} Approved)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Deadline:</span>
                      <span>{new Date(t.registration_deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/organizer/tournaments/${t.id}/registrations`}
                      className="flex-1"
                    >
                      <Button variant="primary" size="sm" className="w-full">
                        <Users className="w-3.5 h-3.5 mr-1" />
                        Review Posters ({t.total_registrations})
                      </Button>
                    </Link>
                    <Button
                      variant={t.status === "PUBLISHED" ? "secondary" : "accent"}
                      size="sm"
                      onClick={() => togglePublish(t.id, t.status)}
                    >
                      {t.status === "PUBLISHED" ? "Close" : "Publish & Open"}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => copyUrl(t)}>
                      Copy URL
                    </Button>
                    <Button variant="accent" size="sm" className="flex-1" onClick={() => shareWhatsApp(t)}>
                      <Share2 className="w-3.5 h-3.5 mr-1" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Header, Footer } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tournament } from "@/lib/tournament-types";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import {
  Gavel,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";

interface AuctionConfigForm {
  name: string;
  start_time: string;
  base_price_default: number;
  min_bid_increment: number;
  timer_seconds: number;
}

function AuctionConfigContent({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const resolvedParams = use(params);
  const tournamentId = resolvedParams.tournamentId;

  const { user, loading } = useAuth();
  const router = useRouter();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm<AuctionConfigForm>({
    defaultValues: {
      name: "Official Player Auction",
      base_price_default: 1000,
      min_bid_increment: 500,
      timer_seconds: 30,
      start_time: new Date().toISOString().slice(0, 16),
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      apiClient<Tournament>(`/tournaments/${tournamentId}`)
        .then(setTournament)
        .catch((err) => setServerError(err.message))
        .finally(() => setFetching(false));
    }
  }, [tournamentId, user, loading]);

  const onSubmit = async (data: AuctionConfigForm) => {
    try {
      setServerError(null);
      setSubmitting(true);
      await apiClient(`/tournaments/${tournamentId}/auction/config`, {
        data: {
          name: data.name,
          start_time: new Date(data.start_time).toISOString(),
          base_price_default: Number(data.base_price_default),
          min_bid_increment: Number(data.min_bid_increment),
          timer_seconds: Number(data.timer_seconds),
        },
      });
      router.push(`/auction/${tournamentId}`);
    } catch (err: any) {
      setServerError(err.message || "Failed to configure auction.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-slate-400">
        Loading auction setup...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => router.push("/dashboard/organizer")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Organizer Console
        </button>

        <div className="mb-8">
          <Badge variant="orange" className="mb-2">Auction Controller</Badge>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">
            Configure <span className="sports-gradient-text">Player Auction</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tournament: <strong className="text-white">{tournament?.title}</strong>
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {serverError}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl bg-[#11141c] border border-slate-800 p-8 space-y-6 sports-card-glow"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
              Auction Event Title
            </label>
            <input
              type="text"
              {...register("name", { required: true })}
              className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                Base Price per Player (INR)
              </label>
              <input
                type="number"
                {...register("base_price_default", { required: true })}
                className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                Minimum Bid Increment (INR)
              </label>
              <input
                type="number"
                {...register("min_bid_increment", { required: true })}
                className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                Bidding Countdown Timer (Seconds)
              </label>
              <input
                type="number"
                {...register("timer_seconds", { required: true })}
                className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                Scheduled Start Time
              </label>
              <input
                type="datetime-local"
                {...register("start_time", { required: true })}
                className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <Button type="submit" variant="primary" size="lg" disabled={submitting}>
              {submitting ? "Configuring..." : "Launch Live Auction Arena"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}

export default function AuctionConfigPage(props: {
  params: Promise<{ tournamentId: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090a0f] text-slate-400 flex items-center justify-center">Loading auction config...</div>}>
      <AuctionConfigContent {...props} />
    </Suspense>
  );
}

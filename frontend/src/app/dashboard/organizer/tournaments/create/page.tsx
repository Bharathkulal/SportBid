"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Header, Footer } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import { Tournament } from "@/lib/tournament-types";
import { Trophy, AlertCircle, ArrowRight } from "lucide-react";

interface CreateTournamentForm {
  title: string;
  sport: string;
  entry_fee: number;
  description: string;
  venue: string;
  city: string;
  state: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  rules: string;
}

export default function CreateTournamentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CreateTournamentForm>({
    defaultValues: {
      sport: "VOLLEYBALL",
      entry_fee: 0,
      title: "",
      description: "",
      venue: "",
      city: "",
      state: "",
      start_date: "",
      end_date: "",
      registration_deadline: "",
      rules: "",
    },
  });

  const selectedSport = watch("sport");

  const onSubmit = async (data: any) => {
    try {
      setServerError(null);
      setSubmitting(true);

      const payload = {
        title: data.title,
        sport: data.sport,
        description: data.description,
        venue: data.venue,
        city: data.city,
        state: data.state,
        start_date: new Date(data.start_date).toISOString(),
        end_date: new Date(data.end_date).toISOString(),
        registration_deadline: new Date(data.registration_deadline).toISOString(),
        entry_fee: parseFloat(data.entry_fee) || 0.0,
        rules: data.rules ? data.rules.split("\n").filter((r: string) => r.trim().length > 0) : [],
      };

      const res = await apiClient<Tournament>("/tournaments", { data: payload });
      router.push(`/dashboard/organizer`);
    } catch (err: any) {
      setServerError(err.message || "Failed to create tournament.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-slate-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <Badge variant="green" className="mb-2">Tournament Wizard</Badge>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">
            Launch New <span className="sports-gradient-text">Tournament</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure your sports discipline, registration timeline, and automatic match poster generation.
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl bg-[#11141c] border border-slate-800 p-8 space-y-6 sports-card-glow">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Tournament Title</label>
              <input
                type="text"
                placeholder="e.g. Bangalore Premier Volleyball Cup 2026"
                {...register("title", { required: "Title is required" })}
                className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Sport Discipline</label>
              <select
                {...register("sport")}
                className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                <option value="VOLLEYBALL">Volleyball (Priority Template)</option>
                <option value="CRICKET">Cricket (Priority Template)</option>
                <option value="FOOTBALL">Football</option>
                <option value="KABADDI">Kabaddi</option>
                <option value="BASKETBALL">Basketball</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Entry Fee (INR)</label>
              <input
                type="number"
                placeholder="0 for Free entry"
                {...register("entry_fee")}
                className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Description</label>
              <textarea
                rows={3}
                placeholder="Provide tournament highlights, squad sizes, and prize purses..."
                {...register("description", { required: "Description is required" })}
                className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg p-4 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Venue / Stadium</label>
              <input
                type="text"
                placeholder="e.g. Koramangala Indoor Stadium"
                {...register("venue", { required: "Venue is required" })}
                className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">City</label>
              <input
                type="text"
                placeholder="Bengaluru"
                {...register("city", { required: true })}
                className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">State / Region</label>
              <input
                type="text"
                placeholder="Karnataka"
                {...register("state", { required: true })}
                className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Start Date</label>
              <input
                type="date"
                {...register("start_date", { required: true })}
                className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">End Date</label>
              <input
                type="date"
                {...register("end_date", { required: true })}
                className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Registration Deadline</label>
              <input
                type="date"
                {...register("registration_deadline", { required: true })}
                className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Rules (One per line)</label>
              <textarea
                rows={3}
                placeholder="Standard FIVB guidelines apply&#10;All players must present original ID"
                {...register("rules")}
                className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg p-4 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="accent"
            size="lg"
            className="w-full py-3 mt-4"
            disabled={submitting}
          >
            {submitting ? "Creating Tournament..." : "Create Tournament"}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  );
}

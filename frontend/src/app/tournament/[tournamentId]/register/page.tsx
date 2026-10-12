"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Header, Footer } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tournament, Registration } from "@/lib/tournament-types";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import {
  Trophy,
  Calendar,
  MapPin,
  Clock,
  Share2,
  CheckCircle2,
  AlertCircle,
  FileImage,
  Upload,
  ArrowRight,
} from "lucide-react";

import { Suspense } from "react";

function RegisterContent({
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
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [registeredResult, setRegisteredResult] = useState<Registration | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    // 1. Safe Redirect: If player is logged out, safely preserve destination URL
    if (!loading && !user) {
      const returnUrl = encodeURIComponent(`/tournament/${tournamentId}/register`);
      router.push(`/login?redirect=${returnUrl}`);
      return;
    }

    // 2. Load tournament details
    apiClient<Tournament>(`/tournaments/${tournamentId}`)
      .then(setTournament)
      .catch((err) => setServerError(err.message))
      .finally(() => setFetching(false));
  }, [tournamentId, user, loading, router]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert("Image exceeds 8MB maximum size limit.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const copyUrl = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const shareWhatsApp = () => {
    if (typeof window !== "undefined" && tournament) {
      const text = encodeURIComponent(
        `🏆 Register for ${tournament.title} on SportBid! Automatic matchday player posters generated:\n${window.location.href}`
      );
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setServerError(null);
      setSubmitting(true);

      const customValues: Record<string, any> = {};
      if (tournament?.custom_fields) {
        for (const f of tournament.custom_fields) {
          customValues[f.key] = data[f.key];
        }
      }

      const payload = {
        player_name: data.player_name || user?.full_name,
        player_phone: data.player_phone || user?.phone_number,
        player_photo_base64: photoBase64,
        custom_field_values: customValues,
      };

      const result = await apiClient<Registration>(
        `/tournaments/${tournamentId}/register`,
        { data: payload }
      );
      setRegisteredResult(result);
    } catch (err: any) {
      setServerError(err.message || "Failed to submit registration.");
    } finally {
      setSubmitting(false);
    }
  };

  if (fetching || loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-slate-400">
        Loading tournament details...
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-[#11141c] border border-slate-800 p-8 rounded-2xl">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold uppercase text-white">Tournament Not Found</h2>
            <p className="text-xs text-slate-400 mt-2 mb-6">
              {serverError || "The tournament you are looking for does not exist or has been removed."}
            </p>
            <Button variant="primary" size="sm" onClick={() => router.push("/tournaments")}>
              Browse All Tournaments
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isClosed = tournament.status !== "PUBLISHED";
  const deadlinePassed = new Date() > new Date(tournament.registration_deadline);

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* Tournament Hero Banner */}
        <div className="rounded-2xl bg-[#11141c] border border-slate-800 p-8 sports-card-glow mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Badge variant={tournament.sport === "VOLLEYBALL" ? "orange" : "green"}>
                {tournament.sport}
              </Badge>
              <Badge variant={tournament.status === "PUBLISHED" ? "green" : "slate"}>
                {tournament.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={copyUrl}>
                {copiedLink ? "Link Copied!" : "Copy Link"}
              </Button>
              <Button variant="accent" size="sm" onClick={shareWhatsApp}>
                <Share2 className="w-3.5 h-3.5 mr-1" />
                Share WhatsApp
              </Button>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight">
            {tournament.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
            {tournament.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
              <span>
                {tournament.venue}, {tournament.city}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
              <span>
                {new Date(tournament.start_date).toLocaleDateString()} to{" "}
                {new Date(tournament.end_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                Deadline: {new Date(tournament.registration_deadline).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Success / Generated Poster State */}
        {registeredResult ? (
          <div className="rounded-2xl bg-[#11141c] border border-emerald-500/40 p-8 text-center sports-card-glow">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h2 className="text-2xl font-black uppercase text-white">Registration Received!</h2>
            <p className="text-xs text-slate-300 mt-2 mb-6 max-w-lg mx-auto">
              Your registration badge <span className="text-emerald-400 font-mono font-bold">{registeredResult.registration_number}</span> has been saved. The deterministic Python Pillow engine has rendered your draft match poster.
            </p>

            {registeredResult.poster_url && (
              <div className="max-w-xs mx-auto mb-6 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
                <img
                  src={registeredResult.poster_url}
                  alt="Generated Player Poster"
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            <div className="inline-flex items-center gap-2 mb-6 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-lg">
              <span>Status: <strong>PENDING ORGANIZER APPROVAL</strong> &bull; Poster will become public upon review.</span>
            </div>

            <div>
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push("/dashboard/player")}
              >
                Go to Player Dashboard
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        ) : isClosed || deadlinePassed ? (
          <div className="p-8 rounded-2xl bg-[#11141c] border border-slate-800 text-center">
            <Clock className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white uppercase">Registration Closed</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Registrations for this tournament are closed or the registration deadline has passed.
            </p>
            <Button variant="secondary" size="sm" onClick={() => router.push("/tournaments")}>
              Explore Other Tournaments
            </Button>
          </div>
        ) : (
          /* Registration Form */
          <div className="rounded-2xl bg-[#11141c] border border-slate-800 p-8 sports-card-glow">
            <h2 className="text-xl font-bold uppercase text-white mb-2">
              Athlete Registration Form
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Complete your sport attributes to generate your official tournament poster.
            </p>

            {serverError && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                    Athlete Full Name
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.full_name}
                    {...register("player_name", { required: true })}
                    className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    defaultValue={user?.phone_number}
                    {...register("player_phone", { required: true })}
                    className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Player Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Player Photograph (Used on Match Poster)
                </label>
                <div className="flex items-center gap-4">
                  {photoBase64 ? (
                    <div className="w-20 h-24 rounded-lg overflow-hidden border border-orange-500 shrink-0">
                      <img src={photoBase64} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-24 rounded-lg bg-slate-800 border border-dashed border-slate-600 flex items-center justify-center shrink-0">
                      <Upload className="w-6 h-6 text-slate-500" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Sport-Specific Custom Fields */}
              {tournament.custom_fields && tournament.custom_fields.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold uppercase text-orange-400 tracking-wider">
                    {tournament.sport} Specific Attributes
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {tournament.custom_fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                          {field.label} {field.required && "*"}
                        </label>
                        {field.field_type === "SELECT" && field.options ? (
                          <select
                            {...register(field.key, { required: field.required })}
                            className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                          >
                            <option value="">Select {field.label}...</option>
                            {field.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.field_type === "NUMBER" ? "number" : "text"}
                            {...register(field.key, { required: field.required })}
                            className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full py-3 mt-4"
                disabled={submitting}
              >
                {submitting ? "Rendering Poster & Submitting..." : "Submit Registration"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function PublicTournamentRegisterPage(props: {
  params: Promise<{ tournamentId: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090a0f] text-slate-400 flex items-center justify-center">Loading tournament details...</div>}>
      <RegisterContent {...props} />
    </Suspense>
  );
}

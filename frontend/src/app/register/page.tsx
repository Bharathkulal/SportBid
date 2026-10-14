"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Header, Footer } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { User, Mail, Phone, Lock, Building, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

const registerSchema = z.object({
  role: z.enum(["PLAYER", "ORGANIZER"]),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  organization_name: z.string().optional(),
  email: z.string().email("Please provide a valid email address"),
  phone_number: z.string().min(7, "Phone number must be at least 7 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterForm() {
  const { registerPlayer, registerOrganizer } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectDestination = searchParams.get("redirect");
  const [role, setRole] = useState<"PLAYER" | "ORGANIZER">("PLAYER");
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "PLAYER",
    },
  });

  const handleRoleChange = (newRole: "PLAYER" | "ORGANIZER") => {
    setRole(newRole);
    setValue("role", newRole);
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setServerError(null);
      setSubmitting(true);
      if (data.role === "PLAYER") {
        await registerPlayer({
          full_name: data.full_name,
          email: data.email,
          phone_number: data.phone_number,
          password: data.password,
        });
      } else {
        await registerOrganizer({
          full_name: data.full_name,
          organization_name: data.organization_name,
          email: data.email,
          phone_number: data.phone_number,
          password: data.password,
        });
      }
      setSuccessMsg("Registration successful! Redirecting you to sign in...");
      setTimeout(() => {
        router.push(redirectDestination ? `/login?redirect=${encodeURIComponent(redirectDestination)}` : "/login");
      }, 1500);
    } catch (err: any) {
      setServerError(err.message || "Registration failed. Please check your details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg bg-[#11141c] border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden sports-card-glow">
          <div className="text-center mb-8">
            <Badge variant="green" className="mb-3">
              Join SportBid
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
              Create Your <span className="sports-gradient-text">Account</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Select your primary platform role to get started
            </p>

            {/* Role Switcher */}
            <div className="mt-6 p-1 bg-[#171b26] border border-slate-800 rounded-xl grid grid-cols-2 gap-1 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => handleRoleChange("PLAYER")}
                className={`py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                  role === "PLAYER"
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Athlete / Player
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("ORGANIZER")}
                className={`py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                  role === "ORGANIZER"
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Organizer
              </button>
            </div>
          </div>

          {serverError && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  {...register("full_name")}
                  placeholder="John Doe"
                  className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              {errors.full_name && (
                <p className="text-xs text-red-400 mt-1">{errors.full_name.message}</p>
              )}
            </div>

            {role === "ORGANIZER" && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Organization / League Name (Optional)
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    {...register("organization_name")}
                    placeholder="Premier Volleyball Club"
                    className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  {...register("email")}
                  placeholder="contact@domain.com"
                  className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  {...register("phone_number")}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              {errors.phone_number && (
                <p className="text-xs text-red-400 mt-1">{errors.phone_number.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  {...register("password")}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant={role === "PLAYER" ? "primary" : "accent"}
              className="w-full py-3 mt-4"
              disabled={submitting}
            >
              {submitting
                ? "Registering..."
                : role === "PLAYER"
                ? "Create Player Account"
                : "Create Organizer Account"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
            Already registered on SportBid?{" "}
            <Link
              href={redirectDestination ? `/login?redirect=${encodeURIComponent(redirectDestination)}` : "/login"}
              className="font-semibold text-orange-400 hover:text-orange-300 transition-colors"
            >
              Sign In Instead
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090a0f] text-slate-400 flex items-center justify-center">Loading Registration...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

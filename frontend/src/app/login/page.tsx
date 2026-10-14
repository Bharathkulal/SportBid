"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Header, Footer } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const redirectDestination = searchParams.get("redirect");
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null);
      setSubmitting(true);
      await login(data, redirectDestination);
    } catch (err: any) {
      setServerError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-[#11141c] border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden sports-card-glow">
          <div className="text-center mb-8">
            <Badge variant="orange" className="mb-3">
              Secure Sign In
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
              Access <span className="text-orange-500">SportBid</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Sign in with your verified athlete or organizer account
            </p>
          </div>

          {serverError && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  {...register("email")}
                  placeholder="athlete@example.com"
                  className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
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
                  placeholder="••••••••"
                  className="w-full bg-[#171b26] border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 mt-2"
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Sign In to Arena"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
            Don't have an account yet?{" "}
            <Link
              href={redirectDestination ? `/register?redirect=${encodeURIComponent(redirectDestination)}` : "/register"}
              className="font-semibold text-orange-400 hover:text-orange-300 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090a0f] text-slate-400 flex items-center justify-center">Loading Sign In...</div>}>
      <LoginForm />
    </Suspense>
  );
}

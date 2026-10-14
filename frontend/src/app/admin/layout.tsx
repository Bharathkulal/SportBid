"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/admin");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white mb-4 shadow-md shadow-emerald-500/20">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-slate-800 font-bold text-base">SportBid Administration</p>
        <p className="text-slate-500 text-xs mt-1">Verifying root privileges...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  // Deny access if not SUPER_ADMIN
  if (user.role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-sm text-slate-600 mt-2">
            The SportBid Super Admin Panel requires root administrative authority. Your account
            is registered with the role <span className="font-semibold text-slate-800">[{user.role}]</span>.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href={
                user.role === "PLAYER"
                  ? "/dashboard/player"
                  : "/dashboard/organizer"
              }
            >
              <Button variant="primary" className="w-full bg-emerald-600 hover:bg-emerald-700">
                Return to My Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Platform Homepage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <AdminNavbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

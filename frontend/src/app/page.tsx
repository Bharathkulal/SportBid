import { Header, Footer } from "@/components/layout/navbar";
import {
  Hero,
  SportsCategories,
  SystemArchitectureOverview,
} from "@/components/landing/sections";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100 selection:bg-orange-500 selection:text-white">
      <Header />
      <main className="flex-1">
        <Hero />
        <SportsCategories />
        <SystemArchitectureOverview />
      </main>
      <Footer />
    </div>
  );
}

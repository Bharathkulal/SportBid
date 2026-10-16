import { Header, Footer } from "@/components/layout/navbar";
import {
  Hero,
  FeaturedTournaments,
  HowItWorks,
  SportsCategories,
  SystemArchitectureOverview,
  CallToAction,
} from "@/components/landing/sections";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080a10] text-slate-100 selection:bg-yellow-400 selection:text-slate-950">
      <Header />
      <main className="flex-1">
        <Hero />
        <FeaturedTournaments />
        <HowItWorks />
        <SportsCategories />
        <SystemArchitectureOverview />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}


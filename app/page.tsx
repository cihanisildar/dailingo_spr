"use client"

import Header from "./_components/Header";
import Hero from "./_components/Hero";
// import Stats from "./_components/Stats";
import Features from "./_components/Features";
import HowItWorks from "./_components/HowItWorks";
import Testimonials from "./_components/Testimonials";
import Footer from "./_components/Footer";
// import Pricing from "./_components/Pricing";
import useLenis from "@/hooks/useLenis";

export default function LandingPage() {
  // Smooth scrolling
  useLenis();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        {/* <Stats /> */}
        <Features />
        <HowItWorks />
        <Testimonials />
        {/* <Pricing /> */}
      </main>
      <Footer />
    </div>
  );
}

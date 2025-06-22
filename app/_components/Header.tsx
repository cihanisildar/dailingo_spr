import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BrainCircuit } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import Repeeker_logo from "../../public/repeeker.png";
gsap.registerPlugin(ScrollTrigger);

export default function Header() {
  const { data: session, status } = useSession();
  const { theme, resolvedTheme } = useTheme();
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Function to handle sign in with proper configuration
  const handleSignIn = () => {
    router.push("/auth/signin");
  };

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const ctx = gsap.context(() => {
      // Initial animation
      const tl = gsap.timeline();

      tl.fromTo(
        header,
        {
          y: -100,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
        }
      );

      // Add scroll animation for header background - theme aware
      ScrollTrigger.create({
        start: "top top",
        end: "max",
        onUpdate: (self) => {
          const progress = Math.min(self.progress * 0.8, 0.8);
          const currentTheme = resolvedTheme || theme;
          const isDark = currentTheme === 'dark';
          
          // Use appropriate background color based on theme
          const bgColor = isDark 
            ? `rgba(17, 24, 39, ${progress})` // gray-900
            : `rgba(255, 255, 255, ${progress})`; // white
            
          const shadowColor = isDark ? '255, 255, 255' : '0, 0, 0';
          const shadowOpacity = isDark ? progress * 0.1 : progress * 0.1;
          
          gsap.to(header, {
            backdropFilter: `blur(${Math.min(self.progress * 20, 12)}px)`,
            backgroundColor: bgColor,
            boxShadow:
              progress > 0.1
                ? `0 4px 6px -1px rgba(${shadowColor}, ${shadowOpacity}), 0 2px 4px -2px rgba(${shadowColor}, ${shadowOpacity})`
                : "none",
            duration: 0.3,
          });
        },
      });

      // Cleanup function
      return () => {
        ScrollTrigger.getAll().forEach((st) => st.kill());
      };
    }, header);

    return () => ctx.revert();
  }, [theme, resolvedTheme]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md transition-colors duration-300"
      style={{ backgroundColor: "rgba(255, 255, 255, 0)" }}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="logo flex items-center group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#5B7CFA]/20 to-[#6C5DD3]/20 dark:from-[#5B7CFA]/30 dark:to-[#6C5DD3]/30 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Image src={Repeeker_logo} alt="logo" width={50} height={50} className="relative z-10" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white ml-2 transition-colors duration-300">Repeeker</span>
        </Link>
        <nav ref={navRef} className="hidden md:flex gap-4">
          {["Features", "How It Works", "Testimonials" /* , "Pricing" */].map(
            (item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="nav-link text-sm font-medium px-3 py-2 text-gray-600 dark:text-gray-300 transition-colors duration-200 relative group hover:text-[#5B7CFA] dark:hover:text-[#6C5DD3]"
              >
                <span className="absolute inset-x-0 -bottom-0.5 h-[1px] bg-gradient-to-r from-[#5B7CFA]/50 to-[#6C5DD3]/50 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
                <span className="relative z-10">{item}</span>
              </Link>
            )
          )}
        </nav>
        <div ref={ctaRef} className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ) : session ? (
            <Button
              variant="ghost"
              className="bg-gradient-to-r from-[#5B7CFA] to-[#6C5DD3] hover:from-[#6C5DD3] hover:to-[#5B7CFA] text-white shadow-lg shadow-blue-200/50 dark:shadow-blue-900/50 hover:shadow-blue-300/75 dark:hover:shadow-blue-800/75 hover:scale-105 transition-all duration-300 ease-out hover:text-white border-0"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="bg-gradient-to-r from-[#5B7CFA] to-[#6C5DD3] hover:from-[#6C5DD3] hover:to-[#5B7CFA] text-white shadow-lg shadow-blue-200/50 dark:shadow-blue-900/50 hover:shadow-blue-300/75 dark:hover:shadow-blue-800/75 hover:scale-105 transition-all duration-300 ease-out hover:text-white border-0"
              onClick={handleSignIn}
            >
              Get Started
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

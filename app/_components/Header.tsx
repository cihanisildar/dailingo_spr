import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BrainCircuit } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import dailingo_logo from "../../public/dailingo_logo.png";
gsap.registerPlugin(ScrollTrigger);

export default function Header() {
  const { data: session, status } = useSession();
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

      // Add scroll animation for header background
      ScrollTrigger.create({
        start: "top top",
        end: "max",
        onUpdate: (self) => {
          const progress = Math.min(self.progress * 0.8, 0.8);
          gsap.to(header, {
            backdropFilter: `blur(${Math.min(self.progress * 20, 12)}px)`,
            backgroundColor: `rgba(255, 255, 255, ${progress})`,
            boxShadow:
              progress > 0.1
                ? `0 4px 6px -1px rgba(0, 0, 0, ${
                    progress * 0.1
                  }), 0 2px 4px -2px rgba(0, 0, 0, ${progress * 0.1})`
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
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full border-b border-gray-100"
      style={{ backgroundColor: "rgba(255, 255, 255, 0)" }}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="logo flex items-center group">
          {/* <div className="relative"> */}
            {/* <div className="absolute inset-0 bg-gray-200 rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div> */}

            <Image src={dailingo_logo} alt="logo" width={50} height={50} />
          {/* </div> */}
          <span className="text-xl font-bold text-gray-900">Dailingo</span>
        </Link>
        <nav ref={navRef} className="hidden md:flex gap-4">
          {["Features", "How It Works", "Testimonials" /* , "Pricing" */].map(
            (item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="nav-link text-sm font-medium px-3 py-2 text-gray-600 transition-colors duration-200 relative group hover:text-rose-600"
              >
                <span className="absolute inset-x-0 -bottom-0.5 h-[1px] bg-rose-600/50 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
                <span className="relative z-10">{item}</span>
              </Link>
            )
          )}
        </nav>
        <div ref={ctaRef} className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse" />
          ) : session ? (
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200/50 hover:shadow-rose-200/75 transition-all duration-300"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                className="text-sm font-medium text-gray-600 hover:text-rose-600 hover:bg-rose-50 transition-all duration-300"
                onClick={handleSignIn}
              >
                Log in
              </Button>
              <Button
                className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200/50 hover:shadow-rose-200/75 transition-all duration-300"
                onClick={handleSignIn}
              >
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

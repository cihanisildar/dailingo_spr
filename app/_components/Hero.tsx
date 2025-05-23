import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;
    const image = imageRef.current;
    
    if (!section || !heading || !image) return;

    const ctx = gsap.context(() => {
      // Initial animation timeline
      const tl = gsap.timeline({ 
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          end: "top 20%",
          toggleActions: "play none none none"
        }
      });
      
      tl.fromTo(
        heading.querySelector(".badge"),
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 }
      )
      .fromTo(
        heading.querySelector("h1"),
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1 },
        "-=0.4"
      )
      .fromTo(
        heading.querySelector("p"),
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        "-=0.6"
      )
      .fromTo(
        ".flex.flex-col.sm\\:flex-row.gap-4 button",
        { opacity: 0 },
        { opacity: 1, duration: 0.5 },
        "-=0.7"
      );

      // Parallax effect for the image
      const parallaxTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        }
      });

      parallaxTl.fromTo(
        image,
        { y: 0 },
        { y: -50 }
      );

      // Floating animation for the image
      const floatingTl = gsap.to(image, {
        y: "+=20",
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });

      // Cleanup function
      return () => {
        tl.kill();
        parallaxTl.kill();
        floatingTl.kill();
        ScrollTrigger.getAll().forEach(st => st.kill());
      };
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className="relative overflow-hidden py-20 md:py-32 bg-gradient-to-b from-rose-50 via-white to-indigo-50"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 w-1/2 h-1/2 bg-gradient-to-br from-rose-200/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -right-1/4 bottom-0 w-1/2 h-1/2 bg-gradient-to-tl from-indigo-200/30 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="container relative flex flex-col items-center text-center z-10">
        <div ref={headingRef}>
          <div className="badge inline-block rounded-full bg-gradient-to-r from-rose-500/10 to-indigo-500/10 px-4 py-1.5 text-sm font-medium text-rose-700 mb-6 opacity-0 backdrop-blur-sm border border-rose-200/20">
            Learn smarter, not harder
          </div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl mb-6 opacity-0 bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-indigo-600">
            Master vocabulary with{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-indigo-500">
              perfect timing
            </span>
          </h1>
          <p className="max-w-[700px] text-gray-600 text-lg md:text-xl mb-10 opacity-0 text-center mx-auto">
            Create word lists and learn them efficiently with our
            scientifically-proven spaced repetition system. Remember more with
            less effort.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-16 justify-center">
            <Button 
              size="lg" 
              className="px-8 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/35 opacity-0"
            >
              Start learning for free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8 border-rose-200 text-rose-700 hover:bg-rose-50 opacity-0"
            >
              See how it works
            </Button>
          </div>
        </div>
        <div ref={imageRef} className="relative w-full max-w-4xl">
          <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent z-10"></div>
          <div className="rounded-2xl border border-rose-100 bg-white/80 shadow-xl overflow-hidden backdrop-blur-sm">
            <div className="relative aspect-[2/1] w-full">
              {/* App screenshot mockup */}
              <div className="absolute inset-0 grid grid-cols-12 gap-4 p-8">
                {/* Sidebar */}
                <div className="col-span-3 rounded-xl bg-gradient-to-br from-rose-50 to-indigo-50 p-4">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-rose-500 to-indigo-500 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 w-3/4 rounded-md bg-rose-200/50"></div>
                    <div className="h-4 w-5/6 rounded-md bg-indigo-200/50"></div>
                    <div className="h-4 w-4/5 rounded-md bg-rose-200/50"></div>
                  </div>
                </div>
                {/* Main content */}
                <div className="col-span-9 space-y-6">
                  {/* Header */}
                  <div className="h-12 rounded-xl bg-gradient-to-r from-rose-100/50 to-indigo-100/50"></div>
                  {/* Content grid */}
                  <div className="grid grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="aspect-[4/3] rounded-xl bg-gradient-to-br from-white to-rose-50 p-4 shadow-sm">
                        <div className="h-4 w-2/3 rounded-md bg-rose-200/50 mb-2"></div>
                        <div className="space-y-2">
                          <div className="h-3 w-full rounded-md bg-indigo-100/50"></div>
                          <div className="h-3 w-5/6 rounded-md bg-indigo-100/50"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Glass overlay */}
              <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]"></div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -left-8 -top-8 w-48 h-48 bg-gradient-to-br from-rose-300/20 to-indigo-300/20 rounded-full blur-3xl"></div>
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-gradient-to-tl from-indigo-300/20 to-rose-300/20 rounded-full blur-3xl"></div>
        </div>
      </div>
    </section>
  );
} 
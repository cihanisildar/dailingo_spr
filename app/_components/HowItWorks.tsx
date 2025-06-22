import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: 1,
    title: "Create your word lists",
    description:
      "Add words, definitions, example sentences, and even images to create comprehensive learning materials.",
    gradient: "from-[#5B7CFA]/20 to-[#6C5DD3]/20",
    darkGradient: "dark:from-[#5B7CFA]/30 dark:to-[#6C5DD3]/30",
    icon: "📝",
  },
  {
    number: 2,
    title: "Take your first test",
    description:
      "Start learning with an initial test to establish your baseline knowledge of the words.",
    gradient: "from-purple-500/20 to-pink-500/20",
    darkGradient: "dark:from-purple-500/30 dark:to-pink-500/30",
    icon: "✍️",
  },
  {
    number: 3,
    title: "Review at optimal intervals",
    description:
      "Our algorithm schedules reviews right before you're likely to forget, strengthening your memory with each session.",
    gradient: "from-pink-500/20 to-orange-500/20",
    darkGradient: "dark:from-pink-500/30 dark:to-orange-500/30",
    icon: "🔄",
  },
  {
    number: 4,
    title: "Master your vocabulary",
    description:
      "As you review, words move to longer intervals until they're permanently stored in your long-term memory.",
    gradient: "from-orange-500/20 to-yellow-500/20",
    darkGradient: "dark:from-orange-500/30 dark:to-yellow-500/30",
    icon: "🎯",
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stepsContainer = stepsRef.current;
    const image = imageRef.current;
    const title = titleRef.current;
    if (!section || !stepsContainer || !image || !title) return;

    const ctx = gsap.context(() => {
      // Enhanced title animation
      const titleTl = gsap.timeline({
        scrollTrigger: {
          trigger: title,
          start: "top 80%",
          end: "top 20%",
          toggleActions: "play none none none",
        },
      });

      titleTl
        .fromTo(
          title.querySelector("h2"),
          { y: 50, opacity: 0, rotateX: -45 },
          { y: 0, opacity: 1, rotateX: 0, duration: 1.2, ease: "power4.out" }
        )
        .fromTo(
          title.querySelector("p"),
          { y: 30, opacity: 0, scale: 0.9 },
          { y: 0, opacity: 1, scale: 1, duration: 1, ease: "power3.out" },
          "-=0.8"
        );

      // Enhanced steps animation
      const stepElements = Array.from(stepsContainer.children);
      const stepsTl = gsap.timeline({
        scrollTrigger: {
          trigger: stepsContainer,
          start: "top 80%",
          end: "top 20%",
          toggleActions: "play none none none",
        },
      });

      stepsTl.fromTo(
        stepElements,
        {
          x: -50,
          opacity: 0,
          scale: 0.8,
          rotateY: -15,
        },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          rotateY: 0,
          duration: 1,
          stagger: 0.25,
          ease: "power4.out",
        }
      );

      // Enhanced parallax effect
      const parallaxTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      });

      parallaxTl.fromTo(image, { y: 0, rotate: -2 }, { y: -80, rotate: 2 });

      // Enhanced hover animations
      const hoverAnimations = stepElements.map((step) => {
        const content = step.querySelector(".step-content");
        const icon = step.querySelector(".step-icon");
        const number = step.querySelector(".step-number");

        const enterAnimation = () => {
          gsap.to(step, {
            scale: 1.03,
            duration: 0.4,
            ease: "power2.out",
          });
          gsap.to(content, {
            x: 8,
            duration: 0.4,
          });
          gsap.to(icon, {
            scale: 1.2,
            rotate: 8,
            duration: 0.4,
          });
          gsap.to(number, {
            scale: 1.1,
            duration: 0.4,
          });
        };

        const leaveAnimation = () => {
          gsap.to(step, {
            scale: 1,
            duration: 0.4,
            ease: "power2.out",
          });
          gsap.to(content, {
            x: 0,
            duration: 0.4,
          });
          gsap.to(icon, {
            scale: 1,
            rotate: 0,
            duration: 0.4,
          });
          gsap.to(number, {
            scale: 1,
            duration: 0.4,
          });
        };

        step.addEventListener("mouseenter", enterAnimation);
        step.addEventListener("mouseleave", leaveAnimation);

        return { step, enterAnimation, leaveAnimation };
      });

      return () => {
        titleTl.kill();
        stepsTl.kill();
        parallaxTl.kill();
        hoverAnimations.forEach(({ step, enterAnimation, leaveAnimation }) => {
          step.removeEventListener("mouseenter", enterAnimation);
          step.removeEventListener("mouseleave", leaveAnimation);
        });
        ScrollTrigger.getAll().forEach((st) => st.kill());
      };
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="py-20 relative overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-300"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-1/4 w-1/2 h-1/2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -right-1/4 bottom-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container relative">
        <div ref={titleRef} className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-4 opacity-0 text-gray-900 dark:text-white transition-colors duration-300">
            How spaced repetition{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#5B7CFA] to-[#6C5DD3] dark:from-[#6C5DD3] dark:to-[#5B7CFA]">
              works for you
            </span>
          </h2>
          <p className="mx-auto max-w-[700px] text-gray-600 dark:text-gray-300 text-base opacity-0 transition-colors duration-300">
            Our scientifically-proven method helps you remember more with less
            study time.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div ref={stepsRef} className="space-y-5">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex gap-3 group cursor-pointer opacity-0 p-4 rounded-lg transition-all duration-300 hover:bg-white/80 dark:hover:bg-gray-800/50 relative overflow-hidden backdrop-blur-sm border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50"
              >
                {/* Background gradient effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${step.gradient} ${step.darkGradient} opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg`} />
                
                <div className="flex-shrink-0 relative z-10">
                  <div className="step-number h-10 w-10 rounded-lg bg-gradient-to-br from-[#5B7CFA]/20 to-[#6C5DD3]/20 dark:from-[#5B7CFA]/30 dark:to-[#6C5DD3]/30 flex items-center justify-center text-[#5B7CFA] dark:text-[#6C5DD3] text-sm font-semibold transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-[#5B7CFA] group-hover:to-[#6C5DD3] group-hover:text-white backdrop-blur-sm border border-[#5B7CFA]/10 dark:border-[#6C5DD3]/20">
                    {step.number}
                  </div>
                </div>
                <div className="step-content relative z-10 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-[#5B7CFA] dark:group-hover:text-[#6C5DD3] transition-colors duration-300">
                      {step.title}
                    </h3>
                    <span className="step-icon text-xl transition-all duration-300">
                      {step.icon}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div ref={imageRef} className="relative mt-4">
            <div className="absolute inset-0 bg-gradient-to-br from-[#5B7CFA]/10 via-[#6C5DD3]/5 to-transparent dark:from-[#5B7CFA]/20 dark:via-[#6C5DD3]/10 dark:to-transparent rounded-2xl" />
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 shadow-2xl overflow-hidden backdrop-blur-sm transition-colors duration-300">
              <Image
                src="/spaced-repetition-graph.svg"
                width={800}
                height={600}
                alt="Spaced repetition graph showing memory retention over time"
                className="w-full h-[360px] object-cover dark:opacity-90"
              />
            </div>
            {/* Enhanced decorative elements */}
            <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-gradient-to-r from-blue-500/30 to-purple-500/30 dark:from-blue-400/40 dark:to-purple-400/40 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-gradient-to-l from-pink-500/30 to-orange-500/30 dark:from-pink-400/40 dark:to-orange-400/40 rounded-full blur-3xl animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/10 dark:from-white/5 dark:to-white/5 rounded-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

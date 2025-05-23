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
    gradient: "from-blue-500/20 to-purple-500/20",
    icon: "📝",
  },
  {
    number: 2,
    title: "Take your first test",
    description:
      "Start learning with an initial test to establish your baseline knowledge of the words.",
    gradient: "from-purple-500/20 to-pink-500/20",
    icon: "✍️",
  },
  {
    number: 3,
    title: "Review at optimal intervals",
    description:
      "Our algorithm schedules reviews right before you're likely to forget, strengthening your memory with each session.",
    gradient: "from-pink-500/20 to-orange-500/20",
    icon: "🔄",
  },
  {
    number: 4,
    title: "Master your vocabulary",
    description:
      "As you review, words move to longer intervals until they're permanently stored in your long-term memory.",
    gradient: "from-orange-500/20 to-yellow-500/20",
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
      className="py-20 relative overflow-hidden"
    >
      <div className="container relative">
        <div ref={titleRef} className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-4 opacity-0">
            How spaced repetition{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              works
            </span>
          </h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground text-base opacity-0">
            Our scientifically-proven method helps you remember more with less
            study time.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div ref={stepsRef} className="space-y-5">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex gap-3 group cursor-pointer opacity-0 p-2 rounded-lg transition-all duration-300 hover:bg-white/50 dark:hover:bg-white/5 relative overflow-hidden backdrop-blur-sm"
              >
                <div className="flex-shrink-0 relative z-10">
                  <div className="step-number h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary text-sm font-semibold transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground backdrop-blur-sm border border-primary/10">
                    {step.number}
                  </div>
                </div>
                <div className="step-content relative z-10">
                  <div
                    className={`absolute inset-0 -left-[200%] -right-[200%] top-0 bottom-0 bg-gradient-to-r ${step.gradient} opacity-0 group-hover:opacity-20 transition-all duration-300 -z-10 blur-2xl`}
                  />
                  <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm group-hover:text-foreground/80 transition-colors duration-300">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div ref={imageRef} className="relative mt-4">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl" />
            <div className="rounded-2xl border bg-white/50 dark:bg-white/5 shadow-2xl overflow-hidden backdrop-blur-sm">
              <Image
                src="/spaced-repetition-graph.svg"
                width={800}
                height={600}
                alt="Spaced repetition graph showing memory retention over time"
                className="w-full h-[360px] object-cover"
              />
            </div>
            {/* Enhanced decorative elements */}
            <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-gradient-to-l from-pink-500/30 to-orange-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/10 dark:from-white/5 dark:to-white/5 rounded-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

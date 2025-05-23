import { useEffect, useRef } from "react";
import { Clock, ListChecks, BrainCircuit } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Clock,
    title: "Spaced Repetition",
    description:
      "Our algorithm schedules reviews at the optimal time to maximize long-term retention with minimal effort.",
    gradient: "from-blue-500/20 via-purple-500/20 to-pink-500/20",
    iconGradient: "from-blue-500/30 via-blue-400/25 to-blue-300/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    hoverColor: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800/30",
  },
  {
    icon: ListChecks,
    title: "Custom Word Lists",
    description:
      "Create and organize your own word lists by topic, difficulty, or any category that makes sense for your learning goals.",
    gradient: "from-purple-500/20 via-pink-500/20 to-orange-500/20",
    iconGradient: "from-purple-500/30 via-purple-400/25 to-purple-300/20",
    iconColor: "text-purple-600 dark:text-purple-400",
    hoverColor: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
    borderColor: "border-purple-200 dark:border-purple-800/30",
  },
  {
    icon: BrainCircuit,
    title: "Smart Analytics",
    description:
      "Track your progress with detailed statistics and insights to understand your learning patterns and improve.",
    gradient: "from-pink-500/20 via-orange-500/20 to-yellow-500/20",
    iconGradient: "from-pink-500/30 via-pink-400/25 to-pink-300/20",
    iconColor: "text-pink-600 dark:text-pink-400",
    hoverColor: "group-hover:text-pink-600 dark:group-hover:text-pink-400",
    borderColor: "border-pink-200 dark:border-pink-800/30",
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const cards = cardsRef.current;
    const title = titleRef.current;
    if (!section || !cards || !title) return;

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

      // Enhanced cards animation
      const cardElements = Array.from(cards.children);
      const cardsTl = gsap.timeline({
        scrollTrigger: {
          trigger: cards,
          start: "top 80%",
          end: "top 20%",
          toggleActions: "play none none none",
        },
      });

      cardsTl.fromTo(
        cardElements,
        {
          y: 100,
          opacity: 0,
          scale: 0.9,
          rotateY: -15,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          rotateY: 0,
          duration: 1,
          stagger: 0.2,
          ease: "power4.out",
        }
      );

      // Enhanced hover animations
      const hoverAnimations = cardElements.map((card) => {
        const icon = card.querySelector(".feature-icon");
        const content = card.querySelector(".feature-content");
        const gradient = card.querySelector(".feature-gradient");

        const enterAnimation = () => {
          gsap.to(card, {
            y: -10,
            scale: 1.02,
            duration: 0.4,
            ease: "power2.out",
          });
          gsap.to(icon, {
            scale: 1.1,
            rotate: 5,
            duration: 0.4,
          });
          gsap.to(gradient, {
            opacity: 1,
            duration: 0.4,
          });
          gsap.to(content, {
            y: -5,
            duration: 0.4,
          });
        };

        const leaveAnimation = () => {
          gsap.to(card, {
            y: 0,
            scale: 1,
            duration: 0.4,
            ease: "power2.out",
          });
          gsap.to(icon, {
            scale: 1,
            rotate: 0,
            duration: 0.4,
          });
          gsap.to(gradient, {
            opacity: 0,
            duration: 0.4,
          });
          gsap.to(content, {
            y: 0,
            duration: 0.4,
          });
        };

        card.addEventListener("mouseenter", enterAnimation);
        card.addEventListener("mouseleave", leaveAnimation);

        return { card, enterAnimation, leaveAnimation };
      });

      return () => {
        titleTl.kill();
        cardsTl.kill();
        hoverAnimations.forEach(({ card, enterAnimation, leaveAnimation }) => {
          card.removeEventListener("mouseenter", enterAnimation);
          card.removeEventListener("mouseleave", leaveAnimation);
        });
        ScrollTrigger.getAll().forEach((st) => st.kill());
      };
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="py-32 relative overflow-hidden"
    >
      <div className="container relative z-10">
        <div ref={titleRef} className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-4 opacity-0">
            Features designed for{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              effective learning
            </span>
          </h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground text-lg opacity-0">
            Our platform combines the best learning techniques with a
            user-friendly interface to help you learn vocabulary efficiently.
          </p>
        </div>
        <div ref={cardsRef} className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`group p-8 rounded-2xl border ${feature.borderColor} bg-white/40 dark:bg-white/5 shadow-xl backdrop-blur-sm relative overflow-hidden opacity-0 transition-all duration-500 hover:shadow-2xl`}
              >
                {/* Background gradient effect */}
                <div
                  className={`feature-gradient absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-25 group-hover:opacity-40 transition-all duration-500`}
                />
                <div className="absolute inset-0 bg-gradient-radial from-white/80 via-white/40 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent opacity-80" />

                <div className="feature-content relative z-10 space-y-6">
                  <div
                    className={`feature-icon h-14 w-14 rounded-xl bg-gradient-to-br ${feature.iconGradient} flex items-center justify-center ${feature.iconColor} border ${feature.borderColor} transition-all duration-300 backdrop-blur-sm`}
                  >
                    <Icon className="h-7 w-7 transition-all duration-300" />
                  </div>
                  <div>
                    <h3
                      className={`text-xl font-bold mb-3 text-gray-900 dark:text-gray-100 ${feature.hoverColor} transition-colors duration-300`}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-base group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

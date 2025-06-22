import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  {
    value: 10000,
    label: "Active Users",
    suffix: "+",
    gradient: "from-blue-500/20 via-purple-500/20 to-pink-500/20",
    darkGradient: "dark:from-blue-500/30 dark:via-purple-500/30 dark:to-pink-500/30",
    textGradient:
      "from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400",
  },
  {
    value: 5000000,
    label: "Words Learned",
    suffix: "+",
    gradient: "from-purple-500/20 via-pink-500/20 to-orange-500/20",
    darkGradient: "dark:from-purple-500/30 dark:via-pink-500/30 dark:to-orange-500/30",
    textGradient:
      "from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400",
  },
  {
    value: 95,
    label: "Retention Rate",
    suffix: "%",
    gradient: "from-pink-500/20 via-orange-500/20 to-yellow-500/20",
    darkGradient: "dark:from-pink-500/30 dark:via-orange-500/30 dark:to-yellow-500/30",
    textGradient:
      "from-pink-600 to-orange-600 dark:from-pink-400 dark:to-orange-400",
  },
  {
    value: 50,
    label: "Less Study Time",
    suffix: "%",
    gradient: "from-purple-500/20 via-blue-500/20 to-purple-500/20",
    darkGradient: "dark:from-purple-500/30 dark:via-blue-500/30 dark:to-purple-500/30",
    textGradient:
      "from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400",
  },
];

export default function Stats() {
  const sectionRef = useRef<HTMLElement>(null);
  const numbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const numbers = numbersRef.current;
    if (!section || !numbers) return;

    const ctx = gsap.context(() => {
      // Animate section background on scroll
      const bgTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none none",
          scrub: 1,
        },
      });

      bgTl.fromTo(
        section,
        { backgroundColor: "rgba(var(--muted), 0)" },
        { backgroundColor: "rgba(var(--muted), 0.1)" }
      );

      // Animate numbers on scroll
      const numberElements = numbers.querySelectorAll(".stat-number");
      const numberAnimations = Array.from(numberElements).map((el, index) => {
        const stat = stats[index];
        const endValue = stat.value;

        return gsap.fromTo(
          el,
          { textContent: "0", opacity: 0, y: 20 },
          {
            textContent: endValue,
            opacity: 1,
            y: 0,
            duration: 2,
            ease: "power2.out",
            snap: { textContent: 1 },
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
              end: "top 20%",
              toggleActions: "play none none none",
            },
            onUpdate: function () {
              const value = Math.round(Number((el as HTMLElement).textContent));
              (el as HTMLElement).textContent =
                value >= 1000
                  ? (value / 1000).toFixed(1) + "k" + stat.suffix
                  : value + stat.suffix;
            },
          }
        );
      });

      // Add hover animations
      const statCards = numbers.querySelectorAll(".stat-card");
      const hoverAnimations = Array.from(statCards).map((card) => {
        const enterAnimation = () => {
          gsap.to(card, {
            scale: 1.05,
            y: -5,
            duration: 0.3,
            ease: "power2.out",
          });
        };

        const leaveAnimation = () => {
          gsap.to(card, {
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out",
          });
        };

        card.addEventListener("mouseenter", enterAnimation);
        card.addEventListener("mouseleave", leaveAnimation);

        return { card, enterAnimation, leaveAnimation };
      });

      // Cleanup function
      return () => {
        bgTl.kill();
        numberAnimations.forEach((anim) => anim.kill());
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
    <section ref={sectionRef} className="py-32 relative overflow-hidden bg-gray-50/50 dark:bg-gray-900/50 transition-colors duration-300">
      {/* Grain effect */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.01] mix-blend-overlay dark:opacity-[0.02]" />

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-1/4 w-1/3 h-1/3 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -right-1/4 bottom-1/4 w-1/3 h-1/3 bg-gradient-to-tl from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container relative z-10">
        <div ref={numbersRef} className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="stat-card group p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 shadow-lg relative overflow-hidden backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300"
            >
              {/* Background gradient effect */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} ${stat.darkGradient} opacity-[0.15] group-hover:opacity-25 transition-all duration-500`}
              />
              <div className="absolute inset-0 bg-gradient-radial from-white/80 via-white/40 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent opacity-60" />

              <div className="relative z-10 space-y-4">
                <h3
                  className={`stat-number text-4xl font-bold bg-gradient-to-br ${stat.textGradient} bg-clip-text text-transparent transition-all duration-300`}
                >
                  0{stat.suffix}
                </h3>
                <p className="text-gray-600/90 dark:text-gray-300/90 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

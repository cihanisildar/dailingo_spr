import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Perfect for getting started with vocabulary learning",
    features: [
      "Create up to 3 word lists",
      "Basic spaced repetition",
      "100 words per list",
      "Text-to-speech for pronunciation",
      "Basic progress tracking"
    ],
    cta: "Get Started",
    popular: false
  },
  {
    name: "Pro",
    price: "9.99",
    description: "Advanced features for serious language learners",
    features: [
      "Unlimited word lists",
      "Advanced spaced repetition",
      "1000 words per list",
      "Audio recording for pronunciation",
      "Detailed analytics",
      "Priority support",
      "Custom study schedules"
    ],
    cta: "Go Pro",
    popular: true
  },
  {
    name: "Team",
    price: "29.99",
    description: "Perfect for teachers and study groups",
    features: [
      "Everything in Pro",
      "Up to 50 team members",
      "Team progress tracking",
      "Shared word lists",
      "Admin dashboard",
      "API access",
      "Custom branding"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

export default function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const title = titleRef.current;
    const cards = cardsRef.current;
    if (!section || !title || !cards) return;

    const ctx = gsap.context(() => {
      // Animate section title
      const titleTl = gsap.timeline({
        scrollTrigger: {
          trigger: title,
          start: "top 80%",
          end: "top 20%",
          toggleActions: "play none none none"
        }
      });

      titleTl
        .fromTo(
          title.querySelector("h2"),
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
        )
        .fromTo(
          title.querySelector("p"),
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
          "-=0.6"
        );

      // Animate cards with stagger
      const cardElements = cards.querySelectorAll(".price-card");
      const cardsTl = gsap.timeline({
        scrollTrigger: {
          trigger: cards,
          start: "top 80%",
          end: "top 20%",
          toggleActions: "play none none none"
        }
      });

      cardsTl.fromTo(
        cardElements,
        {
          y: 100,
          opacity: 0,
          scale: 0.9,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
        }
      );

      // Add hover animations for cards
      const hoverAnimations = Array.from(cardElements).map(card => {
        const enterAnimation = () => {
          gsap.to(card, {
            y: -10,
            scale: 1.02,
            duration: 0.3,
            ease: "power2.out",
          });
        };

        const leaveAnimation = () => {
          gsap.to(card, {
            y: 0,
            scale: 1,
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
        titleTl.kill();
        cardsTl.kill();
        hoverAnimations.forEach(({ card, enterAnimation, leaveAnimation }) => {
          card.removeEventListener("mouseenter", enterAnimation);
          card.removeEventListener("mouseleave", leaveAnimation);
        });
        ScrollTrigger.getAll().forEach(st => st.kill());
      };
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      id="pricing" 
      className="py-20 relative overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-300"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#5B7CFA]/10 to-[#6C5DD3]/10 dark:from-[#5B7CFA]/20 dark:to-[#6C5DD3]/20 rounded-full blur-3xl"></div>
        <div className="absolute -right-1/4 bottom-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container relative z-10">
        <div ref={titleRef} className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4 opacity-0 text-gray-900 dark:text-white transition-colors duration-300">
            Simple, transparent{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#5B7CFA] to-[#6C5DD3] dark:from-[#6C5DD3] dark:to-[#5B7CFA]">pricing</span>
          </h2>
          <p className="mx-auto max-w-[700px] text-gray-600 dark:text-gray-300 text-lg opacity-0 transition-colors duration-300">
            Choose the perfect plan for your vocabulary learning journey.
            No hidden fees, cancel anytime.
          </p>
        </div>
        
        <div ref={cardsRef} className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`price-card relative p-8 rounded-xl border bg-white dark:bg-gray-800 shadow-sm overflow-hidden opacity-0 group transition-all duration-300 ${
                plan.popular 
                  ? 'border-[#5B7CFA] dark:border-[#6C5DD3] shadow-lg shadow-[#5B7CFA]/20 dark:shadow-[#6C5DD3]/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <div className="text-xs font-medium bg-gradient-to-r from-[#5B7CFA] to-[#6C5DD3] text-white px-3 py-1 rounded-bl-lg">
                    Most Popular
                  </div>
                </div>
              )}
              
              {/* Background gradient effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.popular ? 'from-[#5B7CFA]/5 to-[#6C5DD3]/5 dark:from-[#5B7CFA]/10 dark:to-[#6C5DD3]/10' : 'from-gray-500/5 to-gray-600/5 dark:from-gray-400/5 dark:to-gray-500/5'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {plan.description}
                </p>
                
                <Button 
                  className={`w-full mb-8 transition-all duration-300 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-[#5B7CFA] to-[#6C5DD3] hover:from-[#6C5DD3] hover:to-[#5B7CFA] text-white shadow-lg hover:shadow-xl border-0' 
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {plan.cta}
                </Button>

                <div className="space-y-4">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 
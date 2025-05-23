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
      className="py-20 relative overflow-hidden"
    >
      <div className="container relative z-10">
        <div ref={titleRef} className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4 opacity-0">
            Simple, transparent{" "}
            <span className="text-primary">pricing</span>
          </h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground text-lg opacity-0">
            Choose the perfect plan for your vocabulary learning journey.
            No hidden fees, cancel anytime.
          </p>
        </div>
        
        <div
          ref={cardsRef}
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`price-card relative p-8 rounded-xl border bg-card shadow-sm overflow-hidden opacity-0 group ${
                plan.popular ? 'border-primary' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <div className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1 rounded-bl-lg">
                    Most Popular
                  </div>
                </div>
              )}
              
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground mb-6">
                  {plan.description}
                </p>
                
                <Button 
                  className={`w-full mb-8 ${
                    plan.popular 
                      ? 'bg-primary hover:bg-primary/90' 
                      : 'bg-primary/10 hover:bg-primary/20 text-primary'
                  }`}
                >
                  {plan.cta}
                </Button>

                <div className="space-y-4">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">
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
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    text: "I've tried many vocabulary apps, but WordWise is the only one that actually helped me remember words long-term. The spaced repetition system is a game-changer!",
    author: "Sarah K.",
    role: "Language Student",
    gradient: "from-blue-500/20 via-purple-500/20 to-pink-500/20",
  },
  {
    text: "As a teacher, I recommend WordWise to all my students. The ability to create custom word lists and the spaced review tests have significantly improved their vocabulary retention.",
    author: "Michael T.",
    role: "English Teacher",
    gradient: "from-purple-500/20 via-pink-500/20 to-orange-500/20",
  },
  {
    text: "I'm preparing for the TOEFL exam, and WordWise has been invaluable. I study less but remember more. The analytics help me focus on my weak areas.",
    author: "Javier R.",
    role: "TOEFL Candidate",
    gradient: "from-pink-500/20 via-orange-500/20 to-yellow-500/20",
  },
];

export default function Testimonials() {
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
        const stars = card.querySelector(".stars");
        const content = card.querySelector(".content");
        const avatar = card.querySelector(".avatar");

        const enterAnimation = () => {
          gsap.to(card, {
            y: -10,
            scale: 1.02,
            duration: 0.4,
            ease: "power2.out",
          });
          gsap.to(Array.from(stars?.children || []), {
            scale: 1.2,
            rotate: 15,
            duration: 0.4,
            stagger: 0.05,
          });
          gsap.to(content, {
            y: -5,
            duration: 0.4,
          });
          gsap.to(avatar, {
            scale: 1.1,
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
          gsap.to(Array.from(stars?.children || []), {
            scale: 1,
            rotate: 0,
            duration: 0.4,
          });
          gsap.to(content, {
            y: 0,
            duration: 0.4,
          });
          gsap.to(avatar, {
            scale: 1,
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
      id="testimonials"
      className="py-20 relative overflow-hidden"
    >
      <div className="container relative">
        <div ref={titleRef} className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-4 opacity-0">
            What our users{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              say
            </span>
          </h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground text-lg opacity-0">
            Join thousands of satisfied learners who have transformed their
            vocabulary learning experience.
          </p>
        </div>
        <div ref={cardsRef} className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl border bg-white/50 dark:bg-white/5 shadow-xl backdrop-blur-sm relative overflow-hidden opacity-0 transition-all duration-500 hover:shadow-2xl"
            >
              {/* Background gradient effect */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${testimonial.gradient} opacity-0 group-hover:opacity-10 transition-all duration-500`}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

              <div className="relative z-10">
                <div className="stars flex items-center gap-1 text-amber-400 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="none"
                      className="transition-all duration-300"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <div className="content space-y-6">
                  <p className="text-foreground/90 group-hover:text-foreground transition-colors text-lg">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="avatar h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-lg font-bold text-primary border border-primary/10 transition-all duration-300">
                      {testimonial.author[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-base">
                        {testimonial.author}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

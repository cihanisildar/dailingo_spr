import Link from "next/link";
import { BrainCircuit } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const footerLinks = {
  product: ["Features", "Pricing", "Testimonials", "FAQ"],
  company: ["About", "Blog", "Careers", "Contact"],
  legal: ["Terms", "Privacy", "Cookies", "Licenses"],
};

const socialLinks = [
  {
    name: "Twitter",
    icon: (
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    ),
  },
  {
    name: "Instagram",
    icon: (
      <>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </>
    ),
  },
  {
    name: "GitHub",
    icon: (
      <>
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
      </>
    ),
  },
];

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const sectionsRef = useRef<HTMLDivElement>(null);
  const socialsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    const sections = sectionsRef.current;
    const socials = socialsRef.current;
    if (!footer || !sections || !socials) return;

    const ctx = gsap.context(() => {
      // Animate footer sections
      const sectionsTl = gsap.timeline({
        scrollTrigger: {
          trigger: sections,
          start: "top 80%",
          end: "top 20%",
          toggleActions: "play none none none"
        }
      });

      sectionsTl.fromTo(
        sections.querySelectorAll(".footer-section"),
        {
          y: 50,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
        }
      );

      // Animate social icons
      const socialsTl = gsap.timeline({
        scrollTrigger: {
          trigger: socials,
          start: "top 90%",
          end: "top 20%",
          toggleActions: "play none none none"
        }
      });

      socialsTl.fromTo(
        socials.querySelectorAll(".social-icon"),
        {
          scale: 0,
          opacity: 0,
        },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "back.out(2)",
        }
      );

      // Add hover animations for links
      const linkElements = sections.querySelectorAll("a");
      const hoverAnimations = Array.from(linkElements).map(link => {
        const enterAnimation = () => {
          gsap.to(link, {
            x: 4,
            duration: 0.2,
            ease: "power2.out",
          });
        };

        const leaveAnimation = () => {
          gsap.to(link, {
            x: 0,
            duration: 0.2,
            ease: "power2.out",
          });
        };

        link.addEventListener("mouseenter", enterAnimation);
        link.addEventListener("mouseleave", leaveAnimation);

        return { link, enterAnimation, leaveAnimation };
      });

      // Cleanup function
      return () => {
        sectionsTl.kill();
        socialsTl.kill();
        hoverAnimations.forEach(({ link, enterAnimation, leaveAnimation }) => {
          link.removeEventListener("mouseenter", enterAnimation);
          link.removeEventListener("mouseleave", leaveAnimation);
        });
        ScrollTrigger.getAll().forEach(st => st.kill());
      };
    }, footer);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="border-t border-gray-200 dark:border-gray-800 py-12 md:py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div ref={sectionsRef} className="container grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="footer-section space-y-4 opacity-0">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-[#5B7CFA] dark:text-[#6C5DD3]" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">WordWise</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            The smarter way to learn and remember vocabulary with
            scientifically-proven spaced repetition.
          </p>
        </div>
        {Object.entries(footerLinks).map(([category, links]) => (
          <div key={category} className="footer-section opacity-0">
            <h3 className="font-medium mb-4 capitalize text-gray-900 dark:text-white">{category}</h3>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link}>
                  <Link
                    href="#"
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 inline-block"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div ref={socialsRef} className="container mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} WordWise. All rights reserved.
          </p>
          <div className="flex gap-4">
            {socialLinks.map((social) => (
              <Link
                key={social.name}
                href="#"
                className="social-icon text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 hover:scale-110 transform inline-block opacity-0"
              >
                <span className="sr-only">{social.name}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {social.icon}
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
} 
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  IconSparkles,
  IconShieldCheck,
  IconMicrophone,
  IconGlobe,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";
import { SiteLogo } from "@/components/SiteLogo";
import { LiveTicker } from "@/components/InteractiveElements";
import { SpotlightCard } from "@/components/SpotlightCard";
import {
  AmbientGlow,
  TiltContainer,
  MagneticButton,
} from "@/components/AdvancedAnimations";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

// Easing function for stat animation (easeOutExpo)
const easeOutExpo = (x: number): number => {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
};

interface CountUpProps {
  value: number | string;
  suffix?: string;
}

const CountUp = ({ value, suffix = "" }: CountUpProps) => {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setCount(numericValue);
      return;
    }

    let startTimestamp: number | null = null;
    const duration = 1200; // 1.2s animation

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = easeOutExpo(progress);
      setCount(easedProgress * numericValue);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [numericValue, shouldReduceMotion]);

  return (
    <span ref={ref}>
      {Math.floor(count)}
      {suffix}
    </span>
  );
};

// ─── Nav link data with descriptive, visitor-friendly labels ───────────────
const NAV_LINKS = [
  {
    name: "Resume Optimizer",
    path: "/resume",
    description: "Build & tailor your resume",
  },
  {
    name: "Interview Prep",
    path: "/interviews",
    description: "Practice & gain confidence",
  },
];

export default function Home() {
  const containerRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Animation sequences mapping to the specs:
  // 1. Page load: eyebrow badge fades + slides up 8px (100ms delay)
  const eyebrowVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.5,
        delay: shouldReduceMotion ? 0 : 0.1,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  // 2. Headline lines stagger in next (150ms apart)
  const headlineLine1Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.6,
        delay: shouldReduceMotion ? 0 : 0.25,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const headlineLine2Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.6,
        delay: shouldReduceMotion ? 0 : 0.4,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  // 3. Paragraph and CTAs fade in last
  const paragraphVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.5,
        delay: shouldReduceMotion ? 0 : 0.55,
        ease: "easeOut" as const,
      },
    },
  };

  const ctaVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.5,
        delay: shouldReduceMotion ? 0 : 0.7,
        ease: "easeOut" as const,
      },
    },
  };

  // 4. Scroll reveals below the fold: y: 16px to 0, opacity: 0 to 1, once: true, 20% visible
  const scrollRevealVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.6,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-bg overflow-x-hidden font-sans selection:bg-accent-soft text-text"
    >
      {/* 🔮 Ambient Glow Element */}
      <AmbientGlow />

      {/* 💠 Flat Dotted Grid Background Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.25] bg-[radial-gradient(var(--border)_1.5px,transparent_1.5px)] [background-size:24px_24px]"
        style={{
          maskImage:
            "radial-gradient(ellipse at center, black 65%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 65%, transparent 100%)",
        }}
      />

      {/* 🧭 Navbar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 1,
          ease: [0.16, 1, 0.3, 1] as const,
        }}
        className="fixed top-4 inset-x-4 md:inset-x-8 max-w-6xl md:mx-auto h-16 z-[100] flex items-center px-6 md:px-8 bg-bg-surface/90 backdrop-blur-md border border-border rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
      >
        <div className="flex justify-between items-center w-full">
          {/* Logo — always left */}
          <Link href="/" className="group flex items-center gap-2 shrink-0">
            <SiteLogo className="w-14 h-14" />
            <img
              src="/amisync-name-light.svg?v=2"
              alt="AmiSync"
              className="h-8 w-auto block dark:hidden"
              draggable={false}
            />
            <img
              src="/amisync-name-dark.svg?v=2"
              alt="AmiSync"
              className="h-8 w-auto hidden dark:block"
              draggable={false}
            />
          </Link>

          {/* Desktop nav — centered */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className="relative text-[11px] font-bold uppercase tracking-widest text-text-muted hover:text-text transition-all duration-200 cursor-pointer group whitespace-nowrap"
                title={item.description}
              >
                {item.name}
                {/* animated underline */}
                <span className="absolute -bottom-1.5 left-0 w-0 h-[1.5px] bg-accent transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Right cluster — theme + CTA + mobile burger */}
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <ThemeSwitcher />
            <Link
              href="/auth/login"
              className="hidden sm:inline-block px-5 py-2 bg-accent hover:bg-accent-hover text-bg-surface hover:scale-[1.02] active:scale-[0.98] transition-all font-bold text-xs md:text-sm tracking-wider rounded-lg border border-border shadow-sm"
            >
              Access Portal
            </Link>

            {/* Mobile hamburger */}
            <button
              aria-label="Open navigation menu"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 rounded-full hover:bg-accent-soft transition-colors text-text-muted hover:text-text"
            >
              <IconMenu2 size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* 📱 Mobile Nav Drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            key="mobile-nav-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-bg/80 backdrop-blur-sm md:hidden"
            onClick={() => setMobileNavOpen(false)}
          >
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 h-full w-72 bg-bg-surface border-l border-border shadow-2xl flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <SiteLogo className="w-10 h-10" />
                <button
                  aria-label="Close navigation menu"
                  onClick={() => setMobileNavOpen(false)}
                  className="p-2 rounded-full hover:bg-accent-soft text-text-muted hover:text-text transition-colors"
                >
                  <IconX size={20} strokeWidth={2} />
                </button>
              </div>

              {/* Drawer links */}
              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {NAV_LINKS.map((item, i) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.25 }}
                  >
                    <Link
                      href={item.path}
                      onClick={() => setMobileNavOpen(false)}
                      className="flex flex-col px-4 py-3.5 rounded-xl hover:bg-accent-soft group transition-all duration-200"
                    >
                      <span className="text-xs font-black uppercase tracking-widest text-text group-hover:text-accent transition-colors">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-text-muted mt-0.5 font-medium">
                        {item.description}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Drawer CTA */}
              <div className="px-6 py-6 border-t border-border">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileNavOpen(false)}
                  className="block w-full text-center px-5 py-3 bg-accent hover:bg-accent-hover text-bg-surface font-bold text-sm tracking-wider rounded-lg transition-all"
                >
                  Access Portal
                </Link>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-16 px-6 overflow-hidden">
        <div className="text-center space-y-10 z-10 w-full max-w-5xl">
          {/* Eyebrow Badge */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={eyebrowVariants}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-soft border border-border rounded-full text-accent text-[11px] font-bold tracking-[0.04em] uppercase"
          >
            <IconSparkles size={14} className="text-accent stroke-[2]" />
            AI-Powered Career Companion
          </motion.div>

          {/* Headline Parallax — clean, crisp typography without wavy lines */}
          <TiltContainer className="py-6">
            <div className="flex flex-col items-center gap-2 relative">
              <motion.h1
                initial="hidden"
                animate="visible"
                variants={headlineLine1Variants}
                className="text-4xl sm:text-6xl md:text-7xl font-semibold uppercase text-text leading-tight tracking-tight font-display"
              >
                <span>PREPARE WITH</span>
              </motion.h1>
              <motion.h1
                initial="hidden"
                animate="visible"
                variants={headlineLine2Variants}
                className="text-4xl sm:text-6xl md:text-7xl font-semibold uppercase text-text leading-none tracking-tight font-display"
              >
                <span>REAL </span>
                <span className="text-accent">CONFIDENCE.</span>
              </motion.h1>
              <div className="absolute inset-x-0 -bottom-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
          </TiltContainer>

          {/* Supporting Paragraph */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={paragraphVariants}
            className="max-w-[640px] mx-auto text-text-muted text-base md:text-lg font-normal leading-[1.6]"
          >
            <p>
              An all-in-one career platform designed to guide you through every
              step of your job hunt. Build tailored, industry-aligned resumes,
              practice realistic mock interviews, and organize your
              applications. Prepare with guidance, apply with confidence.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={ctaVariants}
            className="flex flex-wrap items-center justify-center gap-5 pt-4"
          >
            <MagneticButton>
              <motion.div
                whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <Link
                  href="/auth/signup"
                  className="inline-block px-8 py-3.5 bg-accent hover:bg-accent-hover text-bg-surface font-bold text-sm tracking-wide rounded-lg transition-colors shadow-sm"
                >
                  Get started
                </Link>
              </motion.div>
            </MagneticButton>

            <MagneticButton>
              <motion.div
                whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <Link
                  href="/interviews"
                  className="inline-block px-8 py-3.5 bg-transparent border border-border rounded-lg font-bold text-sm text-text hover:bg-bg-surface transition-all"
                >
                  Practice mock interview
                </Link>
              </motion.div>
            </MagneticButton>
          </motion.div>

          {/* Stats Cards Row (Scroll Reveal triggered at 20% in-view threshold) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-16"
          >
            {[
              { label: "Resumes Tailored", val: "1200", suffix: "+" },
              { label: "Jobs Aggregated", val: "10", suffix: "K+" },
              { label: "Confidence Boost", val: "95", suffix: "%" },
              { label: "Mock Interviews", val: "500", suffix: "+" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={scrollRevealVariants}
                className="px-6 py-5 bg-bg-raised border border-border rounded-xl flex flex-col items-center justify-center gap-1 hover:border-accent/40 transition-colors cursor-default group"
              >
                <span className="text-accent text-2xl md:text-3xl font-semibold font-display tracking-tight flex items-center">
                  <CountUp value={stat.val} suffix={stat.suffix} />
                </span>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.04em]">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="mt-auto w-full pt-16">
          <LiveTicker
            data={[
              "Tip: Customize your resume summary for each individual job description to rank higher.",
              "Tip: Use strong action verbs in your bullet points (e.g. Led, Designed, Optimized).",
              "Tip: Quantify your results on your resume (e.g., 'Improved load times by 24%').",
              "Tip: Practice mock interviews under simulated constraints to boost your spoken confidence.",
              "Tip: Keep your resume to a clean 1-page layout if you have less than 5 years of experience.",
            ]}
          />
        </div>
      </section>

      {/* Feature Cards Section (Staggered Scroll Reveal at 20% visible threshold) */}
      <section className="py-32 md:py-48 px-8 relative z-10 max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
            },
          }}
          className="text-center mb-20"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-accent mb-3">
            Everything you need
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold uppercase text-text tracking-tight font-display">
            Your career, <span className="text-accent">fully equipped.</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-6 md:gap-8"
        >
          {[
            {
              title: "Resume Optimizer",
              desc: "Build customized, ATS-ready resumes using professional templates and AI-tailored content.",
              icon: IconShieldCheck,
              href: "/resume",
              tag: "Strategy",
            },
            {
              title: "Interview Prep",
              desc: "Practice technical and behavioral mock interviews with live transcription and real-time feedback.",
              icon: IconMicrophone,
              href: "/interviews",
              tag: "Practice",
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              variants={scrollRevealVariants}
              className="h-full"
            >
              <Link href={feature.href} className="block h-full group">
                <SpotlightCard className="p-8 md:p-10 bg-bg-raised border border-border hover:border-accent/40 hover:-translate-y-1.5 shadow-none transition-all duration-300 rounded-[2rem] h-full flex flex-col">
                  {/* Tag pill */}
                  <span className="self-start mb-6 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-accent-soft text-accent border border-accent/20">
                    {feature.tag}
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-accent-soft border border-border flex items-center justify-center mb-6 text-accent group-hover:bg-accent group-hover:text-bg-surface transition-all duration-300">
                    <feature.icon size={22} className="stroke-[1.75]" />
                  </div>
                  <h3 className="text-base font-black uppercase tracking-wide mb-3 text-text transition-colors group-hover:text-accent">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed font-medium transition-colors flex-1">
                    {feature.desc}
                  </p>
                  {/* Arrow indicator */}
                  <div className="mt-6 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span>Explore</span>
                    <span className="translate-x-0 group-hover:translate-x-1 transition-transform duration-200">
                      →
                    </span>
                  </div>
                </SpotlightCard>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
        className="py-16 border-t border-border bg-bg-surface/70 relative z-10"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 px-6 md:px-10">
          <div className="flex items-center gap-3">
            <SiteLogo className="w-10 h-10" />
            <img
              src="/amisync-name-light.svg?v=2"
              alt="AmiSync"
              className="h-6 w-auto opacity-70 block dark:hidden"
              draggable={false}
            />
            <img
              src="/amisync-name-dark.svg?v=2"
              alt="AmiSync"
              className="h-6 w-auto opacity-70 hidden dark:block"
              draggable={false}
            />
            <div className="text-sm font-bold tracking-wider text-text-muted uppercase">
              © 2026 — Empowering Your Career Journey
            </div>
          </div>
          <div className="flex gap-8 text-sm font-bold tracking-wider text-text-muted uppercase">
            <a
              href="#"
              className="hover:text-accent transition-colors relative group"
            >
              Privacy
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-accent transition-all duration-300 group-hover:w-full" />
            </a>
            <a
              href="#"
              className="hover:text-accent transition-colors relative group"
            >
              Terms
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-accent transition-all duration-300 group-hover:w-full" />
            </a>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

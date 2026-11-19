/**
 * CurvedDomeGallery — Interactive Dome Gallery / Curved Loop Showcase
 * Inspired by Watermelon UI, motion-primitives, and ReactBits Dome Gallery.
 * Renders an arc-projected carousel loop that showcases the 4 core platform capabilities
 * with simulated interactive UI widgets, micro-interactions, and 3D depth.
 */
"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  IconShieldCheck,
  IconMicrophone,
  IconBriefcase,
  IconUsers,
  IconArrowRight,
  IconSparkles,
  IconCheck,
  IconWaveSine,
  IconTrendingUp,
} from "@tabler/icons-react";
import Link from "next/link";

interface ShowcaseCard {
  id: string;
  category: "Resume" | "Jobs" | "Interviews" | "Outreach";
  title: string;
  tagline: string;
  metric: string;
  metricLabel: string;
  badge: string;
  href: string;
  icon: typeof IconShieldCheck;
  widget: "ats" | "interview" | "jobs" | "crm";
}

const CARDS: ShowcaseCard[] = [
  {
    id: "resume",
    category: "Resume",
    title: "ATS Optimizer & Tailoring",
    tagline: "Scored 98% against senior tech job descriptions with keyword injection.",
    metric: "98%",
    metricLabel: "ATS Compatibility",
    badge: "Smart Tailoring",
    href: "/resume",
    icon: IconShieldCheck,
    widget: "ats",
  },
  {
    id: "interview",
    category: "Interviews",
    title: "AI Voice Mock Interviewer",
    tagline: "Realistic simulated questions with speech transcription & real-time STAR feedback.",
    metric: "94%",
    metricLabel: "Spoken Fluency",
    badge: "Voice & Transcription",
    href: "/interviews",
    icon: IconMicrophone,
    widget: "interview",
  },
];

// Duplicate for infinite seamless marquee loop
const LOOP_CARDS = [...CARDS, ...CARDS, ...CARDS];

export function CurvedDomeGallery() {
  const shouldReduce = useReducedMotion();
  const [activeCard, setActiveCard] = useState<string | null>(null);

  return (
    <section className="relative w-full py-24 overflow-hidden">
      {/* Curved SVG Dome Guide Line */}
      <div className="absolute inset-x-0 top-12 flex justify-center pointer-events-none opacity-40">
        <svg
          viewBox="0 0 1200 160"
          fill="none"
          className="w-full max-w-6xl h-24 stroke-border"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 140 Q 600 -20 1200 140"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 mb-12 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-border text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-4">
          <IconSparkles size={12} />
          <span>Interactive Platform Showcase</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold uppercase tracking-tight text-text font-display">
          A System Built For <span className="text-accent">Momentum.</span>
        </h2>
        <p className="mt-3 text-text-muted text-sm md:text-base max-w-2xl mx-auto font-medium">
          Glide through each pillar of the career suite. Built with seamless feedback loops from first draft to final round offer.
        </p>
      </div>

      {/* Curved Loop Container */}
      <div className="relative w-full overflow-hidden py-6 [perspective:1200px]">
        {/* Left & Right gradient feathering */}
        <div className="absolute left-0 inset-y-0 w-24 md:w-40 bg-gradient-to-r from-bg to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 inset-y-0 w-24 md:w-40 bg-gradient-to-l from-bg to-transparent z-20 pointer-events-none" />

        <motion.div
          className="flex gap-6 md:gap-8 w-max px-8"
          animate={shouldReduce ? {} : { x: ["0%", "-33.333%"] }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "linear",
          }}
          whileHover={{ animationPlayState: "paused" } as any}
          style={{ willChange: "transform" }}
        >
          {LOOP_CARDS.map((card, idx) => {
            const isHovered = activeCard === `${card.id}-${idx}`;
            const Icon = card.icon;

            return (
              <motion.div
                key={`${card.id}-${idx}`}
                onMouseEnter={() => setActiveCard(`${card.id}-${idx}`)}
                onMouseLeave={() => setActiveCard(null)}
                whileHover={shouldReduce ? {} : { y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="w-[320px] sm:w-[360px] flex-shrink-0 rounded-[2rem] bg-bg-surface border border-border p-6 shadow-md transition-shadow duration-300 hover:shadow-xl hover:border-accent/40 flex flex-col justify-between group"
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-accent-soft text-accent border border-accent/20">
                      {card.badge}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-bg-surface transition-all duration-300">
                      <Icon size={18} strokeWidth={2} />
                    </div>
                  </div>

                  <h3 className="text-lg font-black uppercase tracking-wide text-text mb-2 group-hover:text-accent transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed font-medium mb-6">
                    {card.tagline}
                  </p>
                </div>

                {/* Simulated Interactive Mini-Widget */}
                <div className="p-4 rounded-2xl bg-bg-raised border border-border mb-6">
                  {card.widget === "ats" && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-text-muted">Keyword Coverage</span>
                        <span className="font-black text-accent">{card.metric}</span>
                      </div>
                      <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full w-[98%]" />
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-accent-soft text-accent flex items-center gap-1">
                          <IconCheck size={10} /> Python
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-accent-soft text-accent flex items-center gap-1">
                          <IconCheck size={10} /> Next.js
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-accent-soft text-accent flex items-center gap-1">
                          <IconCheck size={10} /> FastApi
                        </span>
                      </div>
                    </div>
                  )}

                  {card.widget === "interview" && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-accent tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                          Live Mic Feedback
                        </span>
                        <span className="text-[10px] font-black text-text">{card.metric}</span>
                      </div>
                      <div className="flex items-center gap-1 h-6">
                        {[40, 75, 55, 90, 65, 80, 45, 95, 60, 85, 50, 70].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-accent/80 rounded-full"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                      <p className="text-[9px] text-text-muted italic">&ldquo;Concise response with clear metrics.&rdquo;</p>
                    </div>
                  )}

                  {card.widget === "jobs" && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-text">Lead Fullstack Architect</span>
                        <span className="text-[10px] font-black text-accent bg-accent-soft px-1.5 py-0.5 rounded">98% match</span>
                      </div>
                      <p className="text-[10px] text-text-muted">$150k – $180k • Remote • Series B</p>
                      <div className="flex items-center gap-1.5 text-[9px] text-text-muted font-bold">
                        <IconTrendingUp size={12} className="text-accent" />
                        <span>Tailored 1-click application ready</span>
                      </div>
                    </div>
                  )}

                  {card.widget === "crm" && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-text">Sarah Jenkins • VP Talent</span>
                        <span className="text-[9px] font-black uppercase text-accent">Active Now</span>
                      </div>
                      <p className="text-[9px] text-text-muted truncate">&ldquo;Hi Sarah, noticed your team scaling the distributed...&rdquo;</p>
                      <div className="w-full py-1 text-center bg-accent-soft rounded text-[9px] font-black text-accent uppercase tracking-wider">
                        Auto-Drafted Outreach
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer link */}
                <Link
                  href={card.href}
                  className="flex items-center justify-between pt-2 border-t border-border text-xs font-black uppercase tracking-wider text-text group-hover:text-accent transition-colors"
                >
                  <span>Launch Tool</span>
                  <IconArrowRight
                    size={16}
                    className="transform transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}


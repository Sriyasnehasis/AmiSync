/**
 * FeatureMarquee — Curved Dome / infinite horizontal loop strip
 * Inspired by Dome Gallery / Curved Loop pattern from motion-primitives & ReactBits.
 * Shows the 4 nav features as looping pill-cards with icons, pausing on hover.
 */
"use client";

import React, { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  IconShieldCheck,
  IconBriefcase,
  IconUsers,
  IconMicrophone,
  IconSparkles,
  IconTrendingUp,
  IconFileText,
  IconStar,
} from "@tabler/icons-react";

const FEATURES = [
  { label: "Resume Optimizer",  icon: IconShieldCheck,  tag: "AI-Powered"   },
  { label: "Interview Prep",    icon: IconMicrophone,   tag: "Live Feedback" },
  { label: "Skill Gap Analysis",icon: IconSparkles,     tag: "Smart Insights"},
  { label: "Cover Letter AI",   icon: IconFileText,     tag: "1-Click Draft" },
  { label: "Job Tracker",       icon: IconTrendingUp,   tag: "Full Pipeline" },
  { label: "ATS Scorecard",     icon: IconStar,         tag: "Beat the Bots" },
];

// Triple the array so the seamless loop never shows a gap
const ITEMS = [...FEATURES, ...FEATURES, ...FEATURES];

interface PillProps {
  label: string;
  tag: string;
  Icon: typeof IconShieldCheck;
}

function FeaturePill({ label, tag, Icon }: PillProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.03 }}
      transition={{ type: "spring", stiffness: 350, damping: 20 }}
      className="flex-shrink-0 flex items-center gap-3 px-5 py-3.5 rounded-full bg-bg-surface border border-border hover:border-accent/50 hover:bg-accent-soft/50 transition-colors duration-200 cursor-default group shadow-sm"
    >
      <div className="w-8 h-8 rounded-xl bg-accent-soft flex items-center justify-center group-hover:bg-accent group-hover:text-bg-surface transition-all duration-200">
        <Icon size={16} className="text-accent group-hover:text-bg-surface stroke-[1.75] transition-colors" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] font-black uppercase tracking-widest text-text whitespace-nowrap">
          {label}
        </span>
        <span className="text-[9px] font-semibold text-text-muted tracking-wide uppercase">
          {tag}
        </span>
      </div>
    </motion.div>
  );
}

export function FeatureMarquee() {
  const shouldReduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full overflow-hidden py-2 relative select-none" ref={containerRef}>
      {/* Left + right gradient fade masks */}
      <div className="absolute left-0 top-0 h-full w-24 z-10 pointer-events-none bg-gradient-to-r from-bg to-transparent" />
      <div className="absolute right-0 top-0 h-full w-24 z-10 pointer-events-none bg-gradient-to-l from-bg to-transparent" />

      <motion.div
        className="flex gap-4 w-max"
        animate={shouldReduce ? {} : { x: ["0%", "-33.333%"] }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        // Pause on hover
        whileHover={{ animationPlayState: "paused" } as never}
        style={{ willChange: "transform" }}
      >
        {ITEMS.map((item, i) => (
          <FeaturePill
            key={i}
            label={item.label}
            tag={item.tag}
            Icon={item.icon}
          />
        ))}
      </motion.div>
    </div>
  );
}


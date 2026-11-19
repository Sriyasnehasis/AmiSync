/**
 * AnimatedGroup — motion-primitives inspired staggered group entrance
 * Usage:
 *   <AnimatedGroup preset="fade-in-blur" className="grid grid-cols-4 gap-6">
 *     <Card /> <Card /> <Card /> <Card />
 *   </AnimatedGroup>
 */
"use client";

import React from "react";
import { motion, Variants, useReducedMotion } from "framer-motion";

type Preset = "fade-in-blur" | "fade" | "slide-up" | "slide-left" | "zoom";

interface AnimatedGroupProps {
  children: React.ReactNode;
  preset?: Preset;
  className?: string;
  stagger?: number;
  delay?: number;
}

const groupPresets: Record<Preset, { container: Variants; item: Variants }> = {
  "fade-in-blur": {
    container: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } },
    item: { hidden: { opacity: 0, filter: "blur(8px)", y: 16 }, visible: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } } },
  },
  fade: {
    container: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } },
    item: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4 } } },
  },
  "slide-up": {
    container: { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } },
    item: { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } },
  },
  "slide-left": {
    container: { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } },
    item: { hidden: { opacity: 0, x: 32 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } },
  },
  zoom: {
    container: { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } },
    item: { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: "backOut" } } },
  },
};

export function AnimatedGroup({ children, preset = "fade-in-blur", className = "", stagger, delay = 0 }: AnimatedGroupProps) {
  const shouldReduce = useReducedMotion();
  const { container, item } = groupPresets[preset];

  const containerV: Variants = shouldReduce
    ? { hidden: {}, visible: {} }
    : { ...container, visible: { ...(container.visible as object), transition: { staggerChildren: stagger ?? 0.1, delayChildren: delay } } };

  const itemV: Variants = shouldReduce
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : item;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={containerV}
    >
      {React.Children.map(children, (child, i) => (
        <motion.div key={i} variants={itemV} style={{ height: "100%" }}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}


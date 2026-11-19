/**
 * TextEffect — motion-primitives inspired per-word blur-in text animator
 * Usage:
 *   <TextEffect per="word" preset="fade-in-blur" as="h1" delay={0.2} className="...">
 *     Your headline text here
 *   </TextEffect>
 */
"use client";

import React from "react";
import { motion, Variants, useReducedMotion } from "framer-motion";

type Per = "word" | "char" | "line";
type Preset = "fade-in-blur" | "fade" | "slide-up" | "scale";

interface TextEffectProps {
  children: string;
  per?: Per;
  preset?: Preset;
  as?: keyof JSX.IntrinsicElements;
  delay?: number;
  className?: string;
  stagger?: number;
}

const presetVariants: Record<Preset, { container: Variants; item: Variants }> = {
  "fade-in-blur": {
    container: {
      hidden: {},
      visible: { transition: { staggerChildren: 0.06 } },
    },
    item: {
      hidden:  { opacity: 0, filter: "blur(10px)", y: 10 },
      visible: { opacity: 1, filter: "blur(0px)",  y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
    },
  },
  fade: {
    container: { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } },
    item: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4 } } },
  },
  "slide-up": {
    container: { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } },
    item: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } },
  },
  scale: {
    container: { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } },
    item: { hidden: { opacity: 0, scale: 0.85 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "backOut" } } },
  },
};

export function TextEffect({
  children,
  per = "word",
  preset = "fade-in-blur",
  as: Tag = "p",
  delay = 0,
  stagger,
  className = "",
}: TextEffectProps) {
  const shouldReduce = useReducedMotion();
  const { container, item } = presetVariants[preset];

  const tokens: string[] = per === "char"
    ? children.split("")
    : per === "word"
    ? children.split(/(\s+)/)
    : [children];

  const containerVariants: Variants = shouldReduce
    ? { hidden: {}, visible: {} }
    : { ...container, visible: { ...(container.visible as object), transition: { staggerChildren: stagger ?? 0.06, delayChildren: delay } } };

  const itemVariants: Variants = shouldReduce
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : item;

  const Component = Tag as any;

  return (
    <Component className={className}>
      <motion.span
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        style={{ display: "inline" }}
      >
        {tokens.map((token, i) =>
          token.trim() === "" ? (
            <span key={i}>{token}</span>
          ) : (
            <motion.span
              key={i}
              variants={itemVariants}
              style={{ display: "inline-block" }}
            >
              {token}
            </motion.span>
          )
        )}
      </motion.span>
    </Component>
  );
}


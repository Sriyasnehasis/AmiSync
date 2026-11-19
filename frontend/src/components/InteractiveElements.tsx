"use client";
import React from 'react';
import { motion } from 'framer-motion';

interface LiveTickerProps {
  data?: string[];
}

export const LiveTicker = ({ data }: LiveTickerProps) => {
    const defaultFeed = [
        "Tip: Highlight key metrics and results in your work experience.",
        "Tip: Tailor your resume summary to match the job description.",
        "Tip: Practice interview questions under simulated timing constraints.",
        "Tip: Include technical skills and soft skills in separate sections.",
        "Tip: Use the STAR method to structure your behavioral answers.",
        "Tip: Follow up with recruiters 3-5 days after applying.",
        "Tip: Keep your resume to one page if under 5 years of experience."
    ];

    const feed = data || defaultFeed;

    return (
        <div className="w-full bg-bg-surface/60 backdrop-blur-md border-y border-border py-4 overflow-hidden whitespace-nowrap">
            <motion.div 
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="inline-block"
            >
                {[...feed, ...feed].map((item, i) => (
                    <span key={i} className="mx-14 text-xs md:text-sm font-semibold tracking-wide text-text-muted hover:text-accent transition-colors cursor-default">
                        <span className="text-accent mr-3 animate-pulse">●</span> {item}
                    </span>
                ))}
            </motion.div>
        </div>
    );
};

/**
 * HaikeiBackground — Organic layered SVG waves and blob accents
 * Inspired by Haikei.app generators.
 * Uses exact theme tokens (--accent-soft, --border) with low opacities
 * to enrich the background texture without breaking the color palette.
 */
"use client";

import React from "react";

export function HaikeiBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Top Right Organic Blob Accent */}
      <svg
        viewBox="0 0 900 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute -top-24 -right-24 w-[750px] h-[550px] opacity-25 dark:opacity-15"
      >
        <path
          d="M740,280 C810,400 780,510 650,560 C520,610 390,560 320,470 C250,380 230,260 290,160 C350,60 480,-20 600,20 C720,60 670,160 740,280 Z"
          fill="var(--accent-soft)"
        />
      </svg>

      {/* Mid Left Smooth Curve Wave */}
      <svg
        viewBox="0 0 1440 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute top-[45%] -left-32 w-[1600px] h-[360px] opacity-20 dark:opacity-10 transform -rotate-3"
      >
        <path
          d="M0,192L60,181.3C120,171,240,149,360,160C480,171,600,213,720,208C840,203,960,149,1080,138.7C1200,128,1320,160,1380,176L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          fill="var(--border)"
        />
      </svg>

      {/* Bottom Subtle Wave */}
      <svg
        viewBox="0 0 1440 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute -bottom-10 inset-x-0 w-full h-[220px] opacity-20 dark:opacity-10"
      >
        <path
          d="M0,96L80,117.3C160,139,320,181,480,176C640,171,800,117,960,112C1120,107,1280,149,1360,170.7L1440,192L1440,280L1360,280C1280,280,1120,280,960,280C800,280,640,280,480,280C320,280,160,280,80,280L0,280Z"
          fill="var(--accent-soft)"
        />
      </svg>
    </div>
  );
}


"use client";

import React from "react";
import type { ResumeData } from "./templates/types";
import ProfessionalTemplate from "./templates/ProfessionalTemplate";
import ModernTemplate from "./templates/ModernTemplate";
import CreativeTemplate from "./templates/CreativeTemplate";
import MinimalTemplate from "./templates/MinimalTemplate";
import ExecutiveTemplate from "./templates/ExecutiveTemplate";

export { SAMPLE_RESUME_DATA } from "./templates/types";
export type { ResumeData } from "./templates/types";

export const TEMPLATE_META = [
  {
    id: "professional",
    name: "Professional",
    desc: "Clean single-column layout with navy accent. Ideal for corporate, engineering, and finance roles.",
    accent: "#1e3a5e",
  },
  {
    id: "modern",
    name: "Modern",
    desc: "Sidebar-based design with teal accent. Great for tech, data, and analytical roles.",
    accent: "#0891b2",
  },
  {
    id: "creative",
    name: "Creative",
    desc: "Full-width header with purple accent. Perfect for marketing, design, and startups.",
    accent: "#7c3aed",
  },
  {
    id: "minimal",
    name: "Minimal",
    desc: "Typography-driven, distraction-free layout. Best for academia and conservative industries.",
    accent: "#404040",
  },
  {
    id: "executive",
    name: "Executive",
    desc: "Dark header with gold accent. Designed for senior leadership, healthcare, and legal roles.",
    accent: "#d97706",
  },
] as const;

interface TemplateRendererProps {
  templateId: string;
  data: ResumeData;
  scale?: number;
  className?: string;
}

/**
 * Router component that renders the correct resume template based on templateId.
 * Used for both the live preview panel and the gallery thumbnails.
 */
export default function TemplateRenderer({
  templateId,
  data,
  scale,
  className,
}: TemplateRendererProps) {
  const containerStyle: React.CSSProperties = {
    width: scale ? 794 * scale : 794,
    height: scale ? 1123 * scale : undefined,
    overflow: "hidden",
  };

  const inner = (() => {
    switch (templateId) {
      case "modern":
        return <ModernTemplate data={data} scale={scale} />;
      case "creative":
        return <CreativeTemplate data={data} scale={scale} />;
      case "minimal":
        return <MinimalTemplate data={data} scale={scale} />;
      case "executive":
        return <ExecutiveTemplate data={data} scale={scale} />;
      case "professional":
      default:
        return <ProfessionalTemplate data={data} scale={scale} />;
    }
  })();

  return (
    <div className={className} style={containerStyle}>
      {inner}
    </div>
  );
}

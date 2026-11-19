"use client";

import React from "react";
import type { ResumeData } from "./types";

interface Props {
  data: ResumeData;
  scale?: number;
}

/**
 * Modern Template
 * Sidebar-based resume. Left 30% tinted panel with name, contact, skills, certs.
 * Right 70% for summary, experience, projects, education. Teal accent.
 * Ideal for tech, data, and analytical roles.
 */
export default function ModernTemplate({ data, scale }: Props) {
  const accent = "#0891b2";
  const sidebarBg = "#0f172a";
  const sidebarText = "#e2e8f0";
  const sidebarMuted = "#94a3b8";

  return (
    <div
      className="bg-white text-gray-900 font-sans flex"
      style={{
        width: 794,
        minHeight: 1123,
        transform: scale ? `scale(${scale})` : undefined,
        transformOrigin: "top left",
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      {/* Left Sidebar — 30% */}
      <div
        className="flex flex-col"
        style={{
          width: "30%",
          background: sidebarBg,
          color: sidebarText,
          padding: "40px 24px",
        }}
      >
        {/* Name */}
        <div className="mb-8">
          <h1
            className="font-bold leading-tight"
            style={{ fontSize: 22, color: "#ffffff" }}
          >
            {data.title || "Your Name"}
          </h1>
          {data.summary && (
            <p
              className="mt-3"
              style={{ fontSize: 10, color: sidebarMuted, lineHeight: 1.6 }}
            >
              {data.summary.length > 120 ? data.summary.slice(0, 120) + "…" : data.summary}
            </p>
          )}
        </div>

        {/* Contact */}
        {data.contact && (
          <div className="mb-8">
            <h3
              className="font-bold uppercase tracking-widest mb-3"
              style={{ fontSize: 9, color: accent, letterSpacing: "0.15em" }}
            >
              Contact
            </h3>
            <div className="flex flex-col gap-2" style={{ fontSize: 10, color: sidebarMuted }}>
              {data.contact.email && <span>✉ {data.contact.email}</span>}
              {data.contact.phone && <span>☎ {data.contact.phone}</span>}
              {data.contact.location && <span>📍 {data.contact.location}</span>}
              {data.contact.linkedin && <span>🔗 {data.contact.linkedin}</span>}
            </div>
          </div>
        )}

        {/* Skills */}
        {data.skills?.length > 0 && (
          <div className="mb-8">
            <h3
              className="font-bold uppercase tracking-widest mb-3"
              style={{ fontSize: 9, color: accent, letterSpacing: "0.15em" }}
            >
              Skills
            </h3>
            <div className="flex flex-col gap-1.5">
              {data.skills.map((skill, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="rounded-full flex-shrink-0"
                    style={{ width: 5, height: 5, background: accent }}
                  />
                  <span style={{ fontSize: 10.5, color: sidebarText }}>{skill}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <div>
            <h3
              className="font-bold uppercase tracking-widest mb-3"
              style={{ fontSize: 9, color: accent, letterSpacing: "0.15em" }}
            >
              Certifications
            </h3>
            {data.certifications.map((cert, i) => (
              <div key={i} className="mb-3">
                <p className="font-semibold" style={{ fontSize: 10.5, color: "#ffffff" }}>
                  {cert.name}
                </p>
                <p style={{ fontSize: 9.5, color: sidebarMuted }}>
                  {cert.issuer} · {cert.issue_date}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Content — 70% */}
      <div style={{ width: "70%", padding: "40px 36px" }}>
        {/* Summary (full version here) */}
        {data.summary && (
          <section className="mb-6">
            <h2
              className="font-bold uppercase tracking-widest mb-2"
              style={{ fontSize: 10, color: accent, letterSpacing: "0.12em" }}
            >
              About
            </h2>
            <p style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.65 }}>{data.summary}</p>
          </section>
        )}

        {/* Experience */}
        {data.experience?.length > 0 && (
          <section className="mb-6">
            <h2
              className="font-bold uppercase tracking-widest mb-3"
              style={{ fontSize: 10, color: accent, letterSpacing: "0.12em" }}
            >
              Experience
            </h2>
            {data.experience.map((exp, i) => (
              <div key={i} className="mb-4 relative" style={{ paddingLeft: 16 }}>
                <div
                  className="absolute rounded-full"
                  style={{ left: 0, top: 6, width: 7, height: 7, background: accent }}
                />
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold" style={{ fontSize: 12.5, color: "#0f172a" }}>
                    {exp.position}
                  </h3>
                  <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>
                    {exp.start_date} — {exp.is_current ? "Present" : exp.end_date}
                  </span>
                </div>
                <p className="font-medium" style={{ fontSize: 11, color: accent, marginBottom: 2 }}>
                  {exp.company}
                </p>
                {exp.description && (
                  <p style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}>{exp.description}</p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Projects */}
        {data.projects?.length > 0 && (
          <section className="mb-6">
            <h2
              className="font-bold uppercase tracking-widest mb-3"
              style={{ fontSize: 10, color: accent, letterSpacing: "0.12em" }}
            >
              Projects
            </h2>
            {data.projects.map((proj, i) => (
              <div key={i} className="mb-3">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-semibold" style={{ fontSize: 12, color: "#0f172a" }}>
                    {proj.title}
                  </h3>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <span style={{ fontSize: 9.5, color: "#94a3b8" }}>
                      {proj.technologies.join(" · ")}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}>{proj.description}</p>
              </div>
            ))}
          </section>
        )}

        {/* Education */}
        {data.education?.length > 0 && (
          <section>
            <h2
              className="font-bold uppercase tracking-widest mb-3"
              style={{ fontSize: 10, color: accent, letterSpacing: "0.12em" }}
            >
              Education
            </h2>
            {data.education.map((edu, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold" style={{ fontSize: 12, color: "#0f172a" }}>
                    {edu.degree}
                  </h3>
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>
                    {edu.start_date} — {edu.end_date}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "#475569" }}>{edu.school}</p>
                {edu.grade && (
                  <p style={{ fontSize: 10, color: "#94a3b8" }}>{edu.grade}</p>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

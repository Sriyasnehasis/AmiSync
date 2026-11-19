"use client";

import React from "react";
import type { ResumeData } from "./types";

interface Props {
  data: ResumeData;
  scale?: number;
}

/**
 * Minimal Template
 * Ultra-clean typography-driven layout. No color accents, no sidebar.
 * Thin horizontal rules between sections. Left-aligned name in larger weight.
 * Ideal for academia, government, conservative industries.
 */
export default function MinimalTemplate({ data, scale }: Props) {
  const textDark = "#1a1a1a";
  const textMid = "#404040";
  const textLight = "#737373";
  const ruleLine = "#d4d4d4";

  return (
    <div
      className="bg-white font-sans"
      style={{
        width: 794,
        minHeight: 1123,
        padding: scale ? "44px 48px" : "52px 56px",
        transform: scale ? `scale(${scale})` : undefined,
        transformOrigin: "top left",
        fontSize: 14,
        lineHeight: 1.5,
        color: textDark,
      }}
    >
      {/* Header — minimal, left-aligned */}
      <div className="mb-5 pb-4" style={{ borderBottom: `1px solid ${ruleLine}` }}>
        <h1
          className="font-semibold"
          style={{ fontSize: 26, color: textDark, marginBottom: 4, letterSpacing: "-0.01em" }}
        >
          {data.title || "Your Name"}
        </h1>
        {data.contact && (
          <div
            className="flex flex-wrap gap-x-4 gap-y-1"
            style={{ fontSize: 10.5, color: textLight }}
          >
            {data.contact.email && <span>{data.contact.email}</span>}
            {data.contact.phone && <span>{data.contact.phone}</span>}
            {data.contact.location && <span>{data.contact.location}</span>}
            {data.contact.linkedin && <span>{data.contact.linkedin}</span>}
          </div>
        )}
      </div>

      {/* Summary */}
      {data.summary && (
        <section className="mb-5 pb-4" style={{ borderBottom: `1px solid ${ruleLine}` }}>
          <p style={{ fontSize: 11.5, color: textMid, lineHeight: 1.7 }}>{data.summary}</p>
        </section>
      )}

      {/* Experience */}
      {data.experience?.length > 0 && (
        <section className="mb-5 pb-4" style={{ borderBottom: `1px solid ${ruleLine}` }}>
          <h2
            className="font-semibold uppercase tracking-wider mb-3"
            style={{ fontSize: 10.5, color: textDark, letterSpacing: "0.1em" }}
          >
            Experience
          </h2>
          {data.experience.map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-baseline">
                <h3 className="font-medium" style={{ fontSize: 12.5, color: textDark }}>
                  {exp.position}{exp.company ? `, ${exp.company}` : ""}
                </h3>
                <span style={{ fontSize: 10, color: textLight, whiteSpace: "nowrap" }}>
                  {exp.start_date} — {exp.is_current ? "Present" : exp.end_date}
                </span>
              </div>
              {exp.description && (
                <p className="mt-1" style={{ fontSize: 11, color: textMid, lineHeight: 1.65 }}>
                  {exp.description}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {data.education?.length > 0 && (
        <section className="mb-5 pb-4" style={{ borderBottom: `1px solid ${ruleLine}` }}>
          <h2
            className="font-semibold uppercase tracking-wider mb-3"
            style={{ fontSize: 10.5, color: textDark, letterSpacing: "0.1em" }}
          >
            Education
          </h2>
          {data.education.map((edu, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-medium" style={{ fontSize: 12, color: textDark }}>
                  {edu.degree} — {edu.school}
                </span>
                <span style={{ fontSize: 10, color: textLight }}>
                  {edu.start_date} — {edu.end_date}
                </span>
              </div>
              {edu.grade && (
                <p style={{ fontSize: 10, color: textLight }}>{edu.grade}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {data.skills?.length > 0 && (
        <section className="mb-5 pb-4" style={{ borderBottom: `1px solid ${ruleLine}` }}>
          <h2
            className="font-semibold uppercase tracking-wider mb-2"
            style={{ fontSize: 10.5, color: textDark, letterSpacing: "0.1em" }}
          >
            Skills
          </h2>
          <p style={{ fontSize: 11, color: textMid }}>{data.skills.join("  ·  ")}</p>
        </section>
      )}

      {/* Projects */}
      {data.projects?.length > 0 && (
        <section className="mb-5 pb-4" style={{ borderBottom: `1px solid ${ruleLine}` }}>
          <h2
            className="font-semibold uppercase tracking-wider mb-3"
            style={{ fontSize: 10.5, color: textDark, letterSpacing: "0.1em" }}
          >
            Projects
          </h2>
          {data.projects.map((proj, i) => (
            <div key={i} className="mb-3">
              <h3 className="font-medium" style={{ fontSize: 12, color: textDark }}>
                {proj.title}
              </h3>
              <p style={{ fontSize: 11, color: textMid, lineHeight: 1.6 }}>{proj.description}</p>
            </div>
          ))}
        </section>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <section>
          <h2
            className="font-semibold uppercase tracking-wider mb-2"
            style={{ fontSize: 10.5, color: textDark, letterSpacing: "0.1em" }}
          >
            Certifications
          </h2>
          {data.certifications.map((cert, i) => (
            <p key={i} style={{ fontSize: 11, color: textMid, marginBottom: 4 }}>
              {cert.name} — {cert.issuer}, {cert.issue_date}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}

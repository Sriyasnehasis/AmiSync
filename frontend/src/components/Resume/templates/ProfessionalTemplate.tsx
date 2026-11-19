"use client";

import React from "react";
import type { ResumeData } from "./types";

interface Props {
  data: ResumeData;
  scale?: number;
}

/**
 * Professional Template
 * Clean single-column layout. Centered name header → summary → experience → education → skills → projects.
 * Navy accent (#1e3a5e). Ideal for corporate, engineering, finance roles.
 */
export default function ProfessionalTemplate({ data, scale }: Props) {
  const accent = "#1e3a5e";
  const muted = "#64748b";

  return (
    <div
      className="bg-white text-gray-900 font-sans"
      style={{
        width: 794,
        minHeight: 1123,
        padding: scale ? "48px 52px" : "56px 60px",
        transform: scale ? `scale(${scale})` : undefined,
        transformOrigin: "top left",
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      {/* Header — centered name */}
      <div className="text-center pb-5 mb-6" style={{ borderBottom: `2px solid ${accent}` }}>
        <h1
          className="font-bold tracking-tight"
          style={{ fontSize: 28, color: accent, marginBottom: 4 }}
        >
          {data.title || "Your Name"}
        </h1>
        {data.contact && (
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2" style={{ fontSize: 11, color: muted }}>
            {data.contact.email && <span>{data.contact.email}</span>}
            {data.contact.phone && <span>{data.contact.phone}</span>}
            {data.contact.location && <span>{data.contact.location}</span>}
            {data.contact.linkedin && <span>{data.contact.linkedin}</span>}
          </div>
        )}
      </div>

      {/* Summary */}
      {data.summary && (
        <section className="mb-5">
          <h2
            className="font-bold uppercase tracking-widest mb-2"
            style={{ fontSize: 11, color: accent, letterSpacing: "0.12em" }}
          >
            Professional Summary
          </h2>
          <p style={{ fontSize: 12, color: "#334155", lineHeight: 1.65 }}>{data.summary}</p>
        </section>
      )}

      {/* Experience */}
      {data.experience?.length > 0 && (
        <section className="mb-5">
          <h2
            className="font-bold uppercase tracking-widest mb-3"
            style={{ fontSize: 11, color: accent, letterSpacing: "0.12em" }}
          >
            Work Experience
          </h2>
          {data.experience.map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold" style={{ fontSize: 13, color: "#0f172a" }}>
                  {exp.position}
                </h3>
                <span style={{ fontSize: 10.5, color: muted, whiteSpace: "nowrap" }}>
                  {exp.start_date} — {exp.is_current ? "Present" : exp.end_date}
                </span>
              </div>
              <p className="font-medium" style={{ fontSize: 11.5, color: accent, marginBottom: 3 }}>
                {exp.company}
              </p>
              {exp.description && (
                <p style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.6 }}>{exp.description}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {data.education?.length > 0 && (
        <section className="mb-5">
          <h2
            className="font-bold uppercase tracking-widest mb-3"
            style={{ fontSize: 11, color: accent, letterSpacing: "0.12em" }}
          >
            Education
          </h2>
          {data.education.map((edu, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold" style={{ fontSize: 13, color: "#0f172a" }}>
                  {edu.degree}
                </h3>
                <span style={{ fontSize: 10.5, color: muted }}>
                  {edu.start_date} — {edu.end_date}
                </span>
              </div>
              <p style={{ fontSize: 11.5, color: "#475569" }}>{edu.school}</p>
              {edu.grade && (
                <p style={{ fontSize: 10.5, color: muted }}>{edu.grade}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {data.skills?.length > 0 && (
        <section className="mb-5">
          <h2
            className="font-bold uppercase tracking-widest mb-2"
            style={{ fontSize: 11, color: accent, letterSpacing: "0.12em" }}
          >
            Skills
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((skill, i) => (
              <span
                key={i}
                className="rounded"
                style={{
                  fontSize: 10.5,
                  padding: "3px 10px",
                  background: "#f1f5f9",
                  color: "#334155",
                  border: "1px solid #e2e8f0",
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {data.projects?.length > 0 && (
        <section className="mb-5">
          <h2
            className="font-bold uppercase tracking-widest mb-3"
            style={{ fontSize: 11, color: accent, letterSpacing: "0.12em" }}
          >
            Projects
          </h2>
          {data.projects.map((proj, i) => (
            <div key={i} className="mb-3">
              <div className="flex items-baseline gap-2">
                <h3 className="font-semibold" style={{ fontSize: 12.5, color: "#0f172a" }}>
                  {proj.title}
                </h3>
                {proj.link && (
                  <span style={{ fontSize: 10, color: accent }}>{proj.link}</span>
                )}
              </div>
              <p style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.6 }}>{proj.description}</p>
              {proj.technologies && proj.technologies.length > 0 && (
                <p style={{ fontSize: 10, color: muted, marginTop: 2 }}>
                  {proj.technologies.join(" · ")}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <section>
          <h2
            className="font-bold uppercase tracking-widest mb-2"
            style={{ fontSize: 11, color: accent, letterSpacing: "0.12em" }}
          >
            Certifications
          </h2>
          {data.certifications.map((cert, i) => (
            <div key={i} className="mb-2">
              <span className="font-semibold" style={{ fontSize: 12, color: "#0f172a" }}>
                {cert.name}
              </span>
              <span style={{ fontSize: 11, color: muted }}> — {cert.issuer}, {cert.issue_date}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

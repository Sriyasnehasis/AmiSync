"use client";

import React from "react";
import type { ResumeData } from "./types";

interface Props {
  data: ResumeData;
  scale?: number;
}

/**
 * Executive Template
 * Dark header strip with name + title, gold/amber accent. Two balanced columns
 * for experience/skills. Ideal for senior/executive roles, healthcare, legal.
 */
export default function ExecutiveTemplate({ data, scale }: Props) {
  const headerBg = "#1e293b";
  const accent = "#d97706";
  const accentLight = "#fef3c7";

  return (
    <div
      className="bg-white text-gray-900 font-sans"
      style={{
        width: 794,
        minHeight: 1123,
        transform: scale ? `scale(${scale})` : undefined,
        transformOrigin: "top left",
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      {/* Dark Header Strip */}
      <div
        className="flex items-end justify-between"
        style={{
          background: headerBg,
          padding: "32px 48px",
          borderBottom: `4px solid ${accent}`,
        }}
      >
        <div>
          <h1
            className="font-bold"
            style={{ fontSize: 28, color: "#ffffff", marginBottom: 2 }}
          >
            {data.title || "Your Name"}
          </h1>
          {data.experience?.[0]?.position && (
            <p style={{ fontSize: 12, color: accent, fontWeight: 600 }}>
              {data.experience[0].position}
            </p>
          )}
        </div>
        {data.contact && (
          <div
            className="flex flex-col items-end gap-1"
            style={{ fontSize: 10, color: "#94a3b8" }}
          >
            {data.contact.email && <span>{data.contact.email}</span>}
            {data.contact.phone && <span>{data.contact.phone}</span>}
            {data.contact.location && <span>{data.contact.location}</span>}
            {data.contact.linkedin && <span>{data.contact.linkedin}</span>}
          </div>
        )}
      </div>

      {/* Summary Banner */}
      {data.summary && (
        <div
          style={{
            background: accentLight,
            padding: "16px 48px",
            borderBottom: `1px solid #fde68a`,
          }}
        >
          <p style={{ fontSize: 11, color: "#78350f", lineHeight: 1.65 }}>{data.summary}</p>
        </div>
      )}

      {/* Two-column body */}
      <div className="flex" style={{ padding: "28px 48px" }}>
        {/* Left Column — 55% */}
        <div style={{ width: "55%", paddingRight: 28 }}>
          {/* Experience */}
          {data.experience?.length > 0 && (
            <section className="mb-6">
              <h2
                className="font-bold uppercase tracking-widest mb-3 pb-1"
                style={{
                  fontSize: 10,
                  color: accent,
                  letterSpacing: "0.14em",
                  borderBottom: `1.5px solid ${accentLight}`,
                }}
              >
                Professional Experience
              </h2>
              {data.experience.map((exp, i) => (
                <div key={i} className="mb-4">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold" style={{ fontSize: 12.5, color: "#0f172a" }}>
                      {exp.position}
                    </h3>
                    <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>
                      {exp.start_date} — {exp.is_current ? "Present" : exp.end_date}
                    </span>
                  </div>
                  <p
                    className="font-medium"
                    style={{ fontSize: 11, color: headerBg, marginBottom: 3 }}
                  >
                    {exp.company}
                  </p>
                  {exp.description && (
                    <p style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Projects */}
          {data.projects?.length > 0 && (
            <section>
              <h2
                className="font-bold uppercase tracking-widest mb-3 pb-1"
                style={{
                  fontSize: 10,
                  color: accent,
                  letterSpacing: "0.14em",
                  borderBottom: `1.5px solid ${accentLight}`,
                }}
              >
                Key Projects
              </h2>
              {data.projects.map((proj, i) => (
                <div key={i} className="mb-3">
                  <h3 className="font-semibold" style={{ fontSize: 12, color: "#0f172a" }}>
                    {proj.title}
                  </h3>
                  <p style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
                    {proj.description}
                  </p>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <p style={{ fontSize: 9.5, color: "#94a3b8", marginTop: 2 }}>
                      {proj.technologies.join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Right Column — 45% */}
        <div
          style={{
            width: "45%",
            paddingLeft: 24,
            borderLeft: `1.5px solid #f1f5f9`,
          }}
        >
          {/* Skills */}
          {data.skills?.length > 0 && (
            <section className="mb-6">
              <h2
                className="font-bold uppercase tracking-widest mb-3"
                style={{ fontSize: 10, color: accent, letterSpacing: "0.14em" }}
              >
                Core Competencies
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 10,
                      padding: "3px 10px",
                      background: accentLight,
                      color: "#92400e",
                      borderRadius: 4,
                      fontWeight: 500,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {data.education?.length > 0 && (
            <section className="mb-6">
              <h2
                className="font-bold uppercase tracking-widest mb-3"
                style={{ fontSize: 10, color: accent, letterSpacing: "0.14em" }}
              >
                Education
              </h2>
              {data.education.map((edu, i) => (
                <div key={i} className="mb-3">
                  <p className="font-semibold" style={{ fontSize: 11.5, color: "#0f172a" }}>
                    {edu.degree}
                  </p>
                  <p style={{ fontSize: 10.5, color: "#475569" }}>{edu.school}</p>
                  <p style={{ fontSize: 9.5, color: "#94a3b8" }}>
                    {edu.start_date} — {edu.end_date}
                  </p>
                  {edu.grade && (
                    <p style={{ fontSize: 9.5, color: "#94a3b8" }}>{edu.grade}</p>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <section>
              <h2
                className="font-bold uppercase tracking-widest mb-3"
                style={{ fontSize: 10, color: accent, letterSpacing: "0.14em" }}
              >
                Certifications
              </h2>
              {data.certifications.map((cert, i) => (
                <div key={i} className="mb-2">
                  <p className="font-semibold" style={{ fontSize: 11, color: "#0f172a" }}>
                    {cert.name}
                  </p>
                  <p style={{ fontSize: 9.5, color: "#94a3b8" }}>
                    {cert.issuer} · {cert.issue_date}
                  </p>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

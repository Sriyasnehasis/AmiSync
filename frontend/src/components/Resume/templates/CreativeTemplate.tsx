"use client";

import React from "react";
import type { ResumeData } from "./types";

interface Props {
  data: ResumeData;
  scale?: number;
}

/**
 * Creative Template
 * Full-width accent header with large name. Two-column body: wider left for
 * experience/projects, narrower right for skills, education, certifications.
 * Purple accent. Ideal for marketing, design, startups.
 */
export default function CreativeTemplate({ data, scale }: Props) {
  const accent = "#7c3aed";
  const accentLight = "#ede9fe";

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
      {/* Full-width Header */}
      <div
        style={{
          background: accent,
          padding: "36px 48px",
          color: "#ffffff",
        }}
      >
        <h1
          className="font-bold"
          style={{ fontSize: 30, marginBottom: 4, letterSpacing: "-0.01em" }}
        >
          {data.title || "Your Name"}
        </h1>
        {data.contact && (
          <div
            className="flex flex-wrap gap-x-5 gap-y-1"
            style={{ fontSize: 10.5, color: "rgba(255,255,255,0.8)" }}
          >
            {data.contact.email && <span>{data.contact.email}</span>}
            {data.contact.phone && <span>{data.contact.phone}</span>}
            {data.contact.location && <span>{data.contact.location}</span>}
            {data.contact.linkedin && <span>{data.contact.linkedin}</span>}
          </div>
        )}
        {data.summary && (
          <p
            className="mt-3"
            style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", lineHeight: 1.65, maxWidth: "90%" }}
          >
            {data.summary}
          </p>
        )}
      </div>

      {/* Two-column body */}
      <div className="flex" style={{ padding: "28px 48px" }}>
        {/* Left — 62% */}
        <div style={{ width: "62%", paddingRight: 28 }}>
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
                Experience
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
                    style={{ fontSize: 11, color: accent, marginBottom: 3 }}
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
                Projects
              </h2>
              {data.projects.map((proj, i) => (
                <div key={i} className="mb-3">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-semibold" style={{ fontSize: 12, color: "#0f172a" }}>
                      {proj.title}
                    </h3>
                    {proj.link && (
                      <span style={{ fontSize: 9.5, color: accent }}>{proj.link}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
                    {proj.description}
                  </p>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {proj.technologies.map((tech, j) => (
                        <span
                          key={j}
                          style={{
                            fontSize: 9,
                            padding: "2px 8px",
                            background: accentLight,
                            color: accent,
                            borderRadius: 4,
                            fontWeight: 600,
                          }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Right — 38% */}
        <div
          style={{
            width: "38%",
            paddingLeft: 24,
            borderLeft: `1.5px solid ${accentLight}`,
          }}
        >
          {/* Skills */}
          {data.skills?.length > 0 && (
            <section className="mb-6">
              <h2
                className="font-bold uppercase tracking-widest mb-3"
                style={{ fontSize: 10, color: accent, letterSpacing: "0.14em" }}
              >
                Skills
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 10,
                      padding: "3px 10px",
                      background: accentLight,
                      color: "#4c1d95",
                      borderRadius: 6,
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

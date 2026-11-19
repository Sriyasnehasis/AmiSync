// Shared resume data types used across all template renderers

export interface ResumeExperience {
  position: string;
  company: string;
  start_date: string;
  end_date: string;
  is_current?: boolean;
  description: string;
}

export interface ResumeEducation {
  degree: string;
  school: string;
  field_of_study?: string;
  start_date: string;
  end_date: string;
  grade?: string;
  description?: string;
}

export interface ResumeProject {
  title: string;
  description: string;
  technologies?: string[];
  link?: string;
}

export interface ResumeCertification {
  name: string;
  issuer: string;
  issue_date: string;
  credential_url?: string;
}

export interface ResumeContact {
  email?: string;
  phone?: string;
  linkedin?: string;
  location?: string;
  website?: string;
}

export interface ResumeData {
  title: string;
  summary?: string;
  contact?: ResumeContact;
  skills: string[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  projects: ResumeProject[];
  certifications?: ResumeCertification[];
  templateId?: string;
}

export const SAMPLE_RESUME_DATA: ResumeData = {
  title: "Alex Morgan",
  summary:
    "Results-driven software engineer with 5+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud-native architectures. Proven track record of leading cross-functional teams and shipping products used by millions.",
  contact: {
    email: "alex.morgan@email.com",
    phone: "+1 (555) 123-4567",
    linkedin: "linkedin.com/in/alexmorgan",
    location: "San Francisco, CA",
  },
  skills: [
    "React",
    "TypeScript",
    "Node.js",
    "Python",
    "AWS",
    "PostgreSQL",
    "Docker",
    "GraphQL",
    "CI/CD",
    "Agile",
  ],
  experience: [
    {
      position: "Senior Software Engineer",
      company: "TechCorp Inc.",
      start_date: "Jan 2022",
      end_date: "Present",
      is_current: true,
      description:
        "Led a team of 6 engineers to build a real-time analytics dashboard serving 2M+ daily users. Reduced API response times by 40% through query optimization and caching strategies.",
    },
    {
      position: "Software Engineer",
      company: "StartupXYZ",
      start_date: "Jun 2019",
      end_date: "Dec 2021",
      description:
        "Designed and implemented microservices architecture handling 50K+ concurrent requests. Built CI/CD pipelines reducing deployment time from 2 hours to 15 minutes.",
    },
  ],
  education: [
    {
      degree: "B.S. Computer Science",
      school: "University of California, Berkeley",
      start_date: "2015",
      end_date: "2019",
      grade: "3.8 GPA",
    },
  ],
  projects: [
    {
      title: "Open Source CLI Tool",
      description:
        "Built a developer productivity CLI with 1.2K GitHub stars. Automates repetitive project scaffolding tasks.",
      technologies: ["Rust", "GitHub Actions"],
      link: "github.com/alexmorgan/cli-tool",
    },
    {
      title: "Real-time Chat Platform",
      description:
        "Full-stack chat application with WebSocket support, E2E encryption, and file sharing capabilities.",
      technologies: ["React", "Node.js", "Redis"],
    },
  ],
  certifications: [
    {
      name: "AWS Solutions Architect",
      issuer: "Amazon Web Services",
      issue_date: "2023",
    },
  ],
};

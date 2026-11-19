"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Upload, FileText, Sparkles, LayoutGrid, List, Loader2, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ATSGauge } from "@/components/ATSGauge";
import { ResumeCard } from "@/components/ResumeCard";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import TemplateRenderer, { TEMPLATE_META } from "@/components/Resume/TemplateRenderer";

export default function ResumePage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedResume, setSelectedResume] = useState<any>(null);
  const [atsScore, setAtsScore] = useState(0);
  const [insights, setInsights] = useState<any[]>([]);
  
  // AI Synthesis state
  const [synthesizing, setSynthesizing] = useState(false);
  const [targetJob, setTargetJob] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("professional");
  const [enrichGithub, setEnrichGithub] = useState(true);
  const [githubConnected, setGithubConnected] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  // Resume Viewer states
  const [selectedResumeDetails, setSelectedResumeDetails] = useState<any>(null);
  const [newlyAddedSkills, setNewlyAddedSkills] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"preview" | "upload">("preview");
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Custom Live Editor States
  const [isEditing, setIsEditing] = useState(false);
  const [editorTab, setEditorTab] = useState<"summary" | "skills" | "experience" | "projects" | "education">("summary");
  const [editorSkillInput, setEditorSkillInput] = useState("");
  const [savingEdits, setSavingEdits] = useState(false);
  
  // Bullet Rewriter States
  const [rewritingIndex, setRewritingIndex] = useState<number | null>(null);
  const [rewriteSuggestions, setRewriteSuggestions] = useState<string[]>([]);
  const [rewritingActive, setRewritingActive] = useState(false);
  
  // LinkedIn Import States
  const [linkedinText, setLinkedinText] = useState("");
  const [linkedinTitle, setLinkedinTitle] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [importingLinkedIn, setImportingLinkedIn] = useState(false);
  const [showLinkedInPdfModal, setShowLinkedInPdfModal] = useState(false);

  // JD Tailor States
  const [jobDescription, setJobDescription] = useState("");
  const [tailoring, setTailoring] = useState(false);
  const [tailorResults, setTailorResults] = useState<any | null>(null);
  const [showTailorModal, setShowTailorModal] = useState(false);

  const templates = [
    {
      id: "professional",
      name: "Professional",
      desc: "Structured layout with a clear experience timeline. Ideal for engineering, finance, and corporate roles.",
      preview: (
        <div className="w-full h-full flex flex-col gap-1 p-1.5 opacity-80">
          <div className="w-full h-2 bg-[var(--text)] opacity-30 rounded-sm" />
          <div className="flex gap-1.5 flex-1">
            <div className="w-2/3 flex flex-col gap-1">
              <div className="w-full h-1 bg-[var(--text)] opacity-20 rounded-sm" />
              <div className="w-5/6 h-1 bg-[var(--text)] opacity-15 rounded-sm" />
              <div className="w-full h-1 bg-[var(--text)] opacity-15 rounded-sm" />
            </div>
            <div className="w-1/3 flex flex-col gap-1">
              <div className="w-full h-1 bg-[var(--text)] opacity-20 rounded-sm" />
              <div className="w-full h-1 bg-[var(--text)] opacity-15 rounded-sm" />
            </div>
          </div>
        </div>
      )
    },
    {
      id: "modern",
      name: "Modern",
      desc: "Features a sleek sidebar for core credentials and technical skills, optimizing scanning speed.",
      preview: (
        <div className="w-full h-full flex gap-1.5 p-1.5 opacity-80">
          <div className="w-1/3 bg-[var(--text)] opacity-10 rounded-sm h-full flex flex-col gap-1 p-1">
            <div className="w-full h-1 bg-[var(--text)] opacity-25 rounded-sm" />
            <div className="w-2/3 h-0.5 bg-[var(--text)] opacity-20 rounded-sm" />
            <div className="w-3/4 h-0.5 bg-[var(--text)] opacity-20 rounded-sm" />
          </div>
          <div className="w-2/3 flex flex-col gap-1">
            <div className="w-3/4 h-1.5 bg-[var(--text)] opacity-30 rounded-sm" />
            <div className="w-full h-1 bg-[var(--text)] opacity-15 rounded-sm" />
            <div className="w-5/6 h-1 bg-[var(--text)] opacity-15 rounded-sm" />
          </div>
        </div>
      )
    },
    {
      id: "creative",
      name: "Creative",
      desc: "Combines elegant header accents and dynamic font weights. Great for startups, marketing, and design.",
      preview: (
        <div className="w-full h-full flex flex-col gap-1.5 p-1.5 opacity-80">
          <div className="w-full h-3 bg-[var(--accent)] opacity-25 rounded-sm flex items-center px-1">
            <div className="w-1/3 h-1 bg-[var(--text)] opacity-40 rounded-sm" />
          </div>
          <div className="flex flex-col gap-1 mt-0.5">
            <div className="w-full h-1 bg-[var(--text)] opacity-15 rounded-sm" />
            <div className="w-4/5 h-1 bg-[var(--text)] opacity-15 rounded-sm" />
          </div>
        </div>
      )
    },
    {
      id: "minimal",
      name: "Minimal",
      desc: "A timeless, distraction-free typography layout that puts the focus purely on content impact.",
      preview: (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-1.5 opacity-80">
          <div className="w-1/2 h-1.5 bg-[var(--text)] opacity-30 rounded-sm" />
          <div className="w-3/4 h-1 bg-[var(--text)] opacity-15 rounded-sm" />
          <div className="w-2/3 h-1 bg-[var(--text)] opacity-15 rounded-sm" />
        </div>
      )
    },
    {
      id: "executive",
      name: "Executive",
      desc: "Distinguished header layout with amber accent color. Best for management and leadership roles.",
      preview: (
        <div className="w-full h-full flex flex-col gap-1 p-1.5 opacity-80">
          <div className="w-full h-2.5 bg-[var(--text)] opacity-40 rounded-sm" />
          <div className="w-5/6 h-1 bg-[var(--text)] opacity-15 rounded-sm" />
          <div className="w-4/5 h-1 bg-[var(--text)] opacity-15 rounded-sm" />
        </div>
      )
    }
  ];


  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const apiBase = rawApiUrl.endsWith("/api/v1") ? rawApiUrl : `${rawApiUrl}/api/v1`;

  useEffect(() => {
    fetchResumes();
    checkGithubConnection();
  }, []);

  const checkGithubConnection = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/github/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/auth/login");
        toast.error("Session expired. Please log in again.");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setGithubConnected(data.connected);
      }
    } catch (err) {
      console.error("Failed to check github connection", err);
    }
  };

  const handleSynthesizeResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetJob.trim()) return;

    setSynthesizing(true);
    const synthToast = toast.loading("Synthesizing AI resume...");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${apiBase}/resumes/synthesize-ai`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          target_job: targetJob,
          template: selectedTemplate,
          enrich_github: enrichGithub
        })
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/auth/login");
        toast.error("Session expired. Please log in again.", { id: synthToast });
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setTargetJob("");
        toast.success("AI Resume synthesized successfully!", { id: synthToast });
        await fetchResumes();
        
        // Auto-select the newly generated resume if ID returned
        if (data.resume_id) {
          const resList = await fetch(`${apiBase}/resumes`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resList.ok) {
            const dataList = await resList.json();
            setResumes(dataList);
            const newlyCreated = dataList.find((r: any) => r.id === data.resume_id);
            if (newlyCreated) {
              setSelectedResume(newlyCreated);
              setAtsScore(data.ats_score);
              fetchResumeDetails(newlyCreated.id);
              setNewlyAddedSkills([]);
              setActiveTab("preview");
            }
          }
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.detail || "Failed to synthesize resume.";
        toast.error(`Synthesis failed: ${errorMsg}`, { id: synthToast });
      }
    } catch (err) {
      console.error("Synthesis failed", err);
      toast.error("Network error during synthesis.", { id: synthToast });
    } finally {
      setSynthesizing(false);
    }
  };

  const fetchResumes = async (preserveId?: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/resumes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/auth/login");
        toast.error("Session expired. Please log in again.");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setResumes(data);
        if (data.length > 0) {
          const toSelect = preserveId ? (data.find((r: any) => r.id === preserveId) || data[0]) : data[0];
          setSelectedResume(toSelect);
          fetchAnalysis(toSelect.id);
          fetchResumeDetails(toSelect.id);
          setActiveTab("preview");
        } else {
          setSelectedResume(null);
          setSelectedResumeDetails(null);
          setActiveTab("upload");
        }
      }
    } catch (err) {
      console.error("Failed to fetch resumes", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResumeDetails = async (resumeId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoadingDetails(true);

    try {
      const res = await fetch(`${apiBase}/resumes/${resumeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/auth/login");
        toast.error("Session expired. Please log in again.");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setSelectedResumeDetails(data);
      }
    } catch (err) {
      console.error("Failed to fetch resume details", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleLinkedInImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedinText.trim() || !linkedinTitle.trim()) return;

    setImportingLinkedIn(true);
    const importToast = toast.loading("Parsing LinkedIn profile text...");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${apiBase}/resumes/parse-linkedin-text`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          profile_text: linkedinText,
          title: linkedinTitle,
          template: "modern"
        })
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/auth/login");
        toast.error("Session expired. Please log in again.", { id: importToast });
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setLinkedinText("");
        setLinkedinTitle("");
        toast.success("LinkedIn profile parsed & imported successfully!", { id: importToast });
        await fetchResumes(data.resume_id);
      } else {
        toast.error("Failed to parse LinkedIn text.", { id: importToast });
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error during import.", { id: importToast });
    } finally {
      setImportingLinkedIn(false);
    }
  };

  const handleRewriteBullet = async (text: string, index: number, role: string) => {
    if (!text.trim()) return;
    const token = localStorage.getItem("token");
    setRewritingIndex(index);
    setRewritingActive(true);
    setRewriteSuggestions([]);
    
    try {
      const res = await fetch(`${apiBase}/resumes/rewrite-bullet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bullet_text: text,
          role: role || "Professional"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRewriteSuggestions(data.suggestions || []);
      } else {
        toast.error("Failed to generate suggestions.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error during rewrite.");
    } finally {
      setRewritingActive(false);
    }
  };

  const handleSaveResumeEdits = async () => {
    if (!selectedResumeDetails) return;
    setSavingEdits(true);
    const saveToast = toast.loading("Saving resume changes...");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${apiBase}/resumes/${selectedResumeDetails.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: selectedResumeDetails.title,
          summary: selectedResumeDetails.summary,
          template: selectedResumeDetails.template,
          skills: selectedResumeDetails.parsed_data?.skills,
          education: selectedResumeDetails.parsed_data?.education,
          experience: selectedResumeDetails.parsed_data?.experience,
          projects: selectedResumeDetails.parsed_data?.projects,
          certifications: selectedResumeDetails.parsed_data?.certifications
        })
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/auth/login");
        toast.error("Session expired. Please log in again.", { id: saveToast });
        return;
      }

      if (res.ok) {
        toast.success("Changes saved successfully!", { id: saveToast });
        setIsEditing(false);
        // Refresh analysis and summaries
        fetchAnalysis(selectedResumeDetails.id);
        fetchResumes(selectedResumeDetails.id);
      } else {
        toast.error("Failed to save changes.", { id: saveToast });
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error saving changes.", { id: saveToast });
    } finally {
      setSavingEdits(false);
    }
  };

  const handleSaveTemplateChoice = async (templateId: string) => {
    if (!selectedResumeDetails) return;
    const token = localStorage.getItem("token");
    try {
      await fetch(`${apiBase}/resumes/${selectedResumeDetails.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          template: templateId
        })
      });
      toast.success(`Switched style to ${templateId}`);
    } catch (err) {
      console.error("Failed to auto-save template choice", err);
    }
  };

  const handleTailorResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim() || !selectedResumeDetails) return;

    setTailoring(true);
    const tailorToast = toast.loading("Analyzing and tailoring resume to JD...");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${apiBase}/resumes/${selectedResumeDetails.id}/tailor`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          job_description: jobDescription
        })
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/auth/login");
        toast.error("Session expired. Please log in again.", { id: tailorToast });
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setTailorResults(data);
        setShowTailorModal(true);
        toast.success("Resume tailored! Review suggestions and match score changes.", { id: tailorToast });
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.detail || "Failed to tailor resume.";
        toast.error(`Tailor failed: ${errorMsg}`, { id: tailorToast });
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error tailoring resume.", { id: tailorToast });
    } finally {
      setTailoring(false);
    }
  };

  const handleApplyTailoredChanges = () => {
    if (!tailorResults || !selectedResumeDetails) return;

    setSelectedResumeDetails((prev: any) => ({
      ...prev,
      summary: tailorResults.rewritten_summary,
      parsed_data: {
        ...prev.parsed_data,
        experience: tailorResults.rewritten_experience,
        skills: [...new Set([...(prev.parsed_data?.skills || []), ...(tailorResults.suggested_skills || [])])]
      }
    }));

    setAtsScore(tailorResults.jd_match_score_after);
    setShowTailorModal(false);
    toast.success("Suggestions applied locally! Remember to save changes.");
  };

  const handleExportResume = async (format: "pdf" | "docx") => {
    if (!selectedResumeDetails) return;
    const token = localStorage.getItem("token");
    const exportToast = toast.loading(`Generating ${format.toUpperCase()}...`);
    try {
      const res = await fetch(`${apiBase}/resumes/${selectedResumeDetails.id}/export/${format}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/auth/login");
        toast.error("Session expired. Please log in again.", { id: exportToast });
        return;
      }
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedResumeDetails.title || "Resume"}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success(`${format.toUpperCase()} downloaded successfully!`, { id: exportToast });
      } else {
        toast.error(`Failed to export: ${res.statusText}`, { id: exportToast });
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to export resume as ${format.toUpperCase()}`, { id: exportToast });
    }
  };

  const fetchAnalysis = async (resumeId: number) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiBase}/resumes/${resumeId}/ats-analysis`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/auth/login");
        toast.error("Session expired. Please log in again.");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setAtsScore(data.ats_score);
        setInsights([
          ...(data.missing_skills?.map((s: string) => ({ text: `Missing '${s}' keyword`, type: "error" })) || []),
          { text: data.feedback?.substring(0, 80) + "...", type: "info" }
        ].slice(0, 5));
        // Sync local resumes state to match the updated database score
        setResumes(prev => prev.map(r => r.id === resumeId ? { ...r, ats_score: data.ats_score } : r));
      }
    } catch (err) {
      console.error("Analysis failed", err);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const loadingToast = toast.loading(`Uploading "${file.name}"...`);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${apiBase}/resumes/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/auth/login");
        toast.error("Session expired. Please log in again.", { id: loadingToast });
        return;
      }
      if (res.ok) {
        toast.success("Resume uploaded and parsed successfully!", { id: loadingToast });
        await fetchResumes();
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.detail || "Failed to process resume.";
        toast.error(`Upload failed: ${errorMsg}`, { id: loadingToast });
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please try again.", { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

  const handleOptimizeResume = async () => {
    if (!selectedResume || !selectedResumeDetails) return;
    setOptimizing(true);
    const optToast = toast.loading("Optimizing resume with AI...");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${apiBase}/resumes/${selectedResume.id}/optimize`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/auth/login");
        toast.error("Session expired. Please log in again.", { id: optToast });
        return;
      }
      if (res.ok) {
        const data = await res.json();
        
        // Find which skills were newly added by AI
        const oldSkills = selectedResumeDetails?.parsed_data?.skills || [];
        const newSkills = data.skills || [];
        const added = newSkills.filter((s: string) => !oldSkills.some((os: string) => os.toLowerCase() === s.toLowerCase()));
        setNewlyAddedSkills(added);
        
        toast.success("Resume optimized and updated successfully!", { id: optToast });

        // Update details in-place
        setSelectedResumeDetails((prev: any) => ({
          ...prev,
          summary: data.summary,
          ats_score: data.ats_score,
          parsed_data: {
            ...prev.parsed_data,
            skills: data.skills
          }
        }));

        // Trigger updates in list and gauge
        setAtsScore(data.ats_score);
        setResumes((prev: any[]) => prev.map(r => r.id === selectedResume.id ? { ...r, ats_score: data.ats_score } : r));
        
        // Fetch fresh ATS insights to match the new score
        fetchAnalysis(selectedResume.id);
      } else {
        const errData = await res.json().catch(() => ({}));
        const errDetail = errData.detail || "Failed to optimize resume.";
        toast.error(`Optimization failed: ${errDetail}`, { id: optToast });
      }
    } catch (err) {
      console.error("Optimization failed", err);
      toast.error("Network error during optimization. Please try again.", { id: optToast });
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-12 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="space-y-2">
              <h1 className="text-5xl font-display font-black tracking-tight">Resume <span className="italic font-serif-italic font-normal lowercase">Builder.</span></h1>
              <p className="text-text-muted text-sm max-w-lg">Manage your professional resumes and optimize for standard Applicant Tracking Systems (ATS).</p>
           </div>
           <div className="flex items-center gap-3">
              <button className="p-2.5 bg-bg-raised border border-border rounded-xl text-text-muted hover:text-accent transition-all">
                 <LayoutGrid size={18} />
              </button>
              <button className="p-2.5 bg-accent-soft border border-accent/20 rounded-xl text-accent transition-all">
                 <List size={18} />
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main List */}
          <div className="lg:col-span-8 space-y-8">
            {/* Sleek Tab Navigation */}
            <div className="flex border-b border-border/60 pb-px">
              <button
                onClick={() => setActiveTab("preview")}
                className={`py-3.5 px-6 font-display font-black text-[10px] uppercase tracking-[0.2em] border-b-2 transition-all relative ${
                  activeTab === "preview"
                    ? "border-accent text-accent"
                    : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                Resume Preview
                {activeTab === "preview" && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("upload")}
                className={`py-3.5 px-6 font-display font-black text-[10px] uppercase tracking-[0.2em] border-b-2 transition-all relative ${
                  activeTab === "upload"
                    ? "border-accent text-accent"
                    : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                Upload & Create
                {activeTab === "upload" && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                )}
              </button>
            </div>

            {activeTab === "preview" ? (
              <div className="space-y-8">
                {loadingDetails ? (
                  <div className="py-24 flex flex-col items-center justify-center gap-4 text-text-muted/30">
                    <Loader2 className="animate-spin text-accent" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Syncing details...</p>
                  </div>
                ) : !selectedResumeDetails ? (
                  <div className="py-20 text-center glass-card border-dashed border-border p-8 flex flex-col items-center justify-center gap-4 bg-bg-raised/5">
                    <FileText size={40} className="opacity-15 text-text-muted" />
                    <p className="text-sm font-bold text-text-muted">No resume details loaded. Please upload a resume or select one from the list below.</p>
                  </div>
                ) : (
                  <div className={`grid grid-cols-1 ${isEditing ? "lg:grid-cols-2" : ""} gap-8`}>
                    {/* Left Column: Form Editor (shown only when isEditing is true) */}
                    {isEditing && (
                      <div className="bg-bg-surface border border-border rounded-2xl p-6 space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-border/60">
                          <h3 className="text-sm font-black uppercase tracking-wider text-text">Resume Editor</h3>
                          <button
                            onClick={handleSaveResumeEdits}
                            disabled={savingEdits}
                            className="btn-premium !py-2 !px-4 text-[9px] uppercase font-bold tracking-wider rounded-lg"
                          >
                            {savingEdits ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                        {/* Tabs for sections */}
                        <div className="flex gap-2 border-b border-border/40 pb-2">
                          {["Summary", "Skills", "Experience", "Projects", "Education"].map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setEditorTab(tab.toLowerCase() as any)}
                              className={`py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider border-b-2 ${
                                editorTab === tab.toLowerCase()
                                  ? "border-accent text-accent"
                                  : "border-transparent text-text-muted hover:text-text"
                              }`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>
                        
                        {/* Editor Panels */}
                        <div className="space-y-4">
                          {editorTab === "summary" && (
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Summary</label>
                              <textarea
                                rows={8}
                                value={selectedResumeDetails.summary || ""}
                                onChange={(e) => {
                                  setSelectedResumeDetails({
                                    ...selectedResumeDetails,
                                    summary: e.target.value
                                  });
                                }}
                                className="w-full px-4 py-2.5 bg-bg-raised border border-border rounded-xl text-text focus:outline-none focus:border-accent resize-none text-xs leading-relaxed"
                              />
                            </div>
                          )}

                          {editorTab === "skills" && (
                            <div className="space-y-4">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Add skill (e.g. React)"
                                  value={editorSkillInput}
                                  onChange={(e) => setEditorSkillInput(e.target.value)}
                                  className="flex-1 input-premium py-2 text-xs bg-bg-raised"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      if (editorSkillInput.trim()) {
                                        const currentSkills = selectedResumeDetails.parsed_data?.skills || [];
                                        setSelectedResumeDetails({
                                          ...selectedResumeDetails,
                                          parsed_data: {
                                            ...selectedResumeDetails.parsed_data,
                                            skills: [...currentSkills, editorSkillInput.trim()]
                                          }
                                        });
                                        setEditorSkillInput("");
                                      }
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editorSkillInput.trim()) {
                                      const currentSkills = selectedResumeDetails.parsed_data?.skills || [];
                                      setSelectedResumeDetails({
                                        ...selectedResumeDetails,
                                        parsed_data: {
                                          ...selectedResumeDetails.parsed_data,
                                          skills: [...currentSkills, editorSkillInput.trim()]
                                        }
                                      });
                                      setEditorSkillInput("");
                                    }
                                  }}
                                  className="px-4 py-2 bg-accent text-bg-surface rounded-xl text-[10px] font-bold uppercase tracking-wider"
                                >
                                  Add
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {(selectedResumeDetails.parsed_data?.skills || []).map((skill: string, idx: number) => (
                                  <span key={idx} className="px-2.5 py-1 bg-bg-raised border border-border rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                    {skill}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentSkills = selectedResumeDetails.parsed_data?.skills || [];
                                        setSelectedResumeDetails({
                                          ...selectedResumeDetails,
                                          parsed_data: {
                                            ...selectedResumeDetails.parsed_data,
                                            skills: currentSkills.filter((_: any, i: number) => i !== idx)
                                          }
                                        });
                                      }}
                                      className="text-text-muted hover:text-red-500 font-bold"
                                    >
                                      &times;
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {editorTab === "experience" && (
                            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                              {(selectedResumeDetails.parsed_data?.experience || []).map((exp: any, idx: number) => (
                                <div key={idx} className="border border-border/60 rounded-xl p-4 bg-bg-raised/20 space-y-3 relative group">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentExp = selectedResumeDetails.parsed_data?.experience || [];
                                      setSelectedResumeDetails({
                                        ...selectedResumeDetails,
                                        parsed_data: {
                                          ...selectedResumeDetails.parsed_data,
                                          experience: currentExp.filter((_: any, i: number) => i !== idx)
                                        }
                                      });
                                    }}
                                    className="absolute top-2 right-2 text-text-muted hover:text-red-500 font-bold text-sm"
                                    title="Delete Experience"
                                  >
                                    Delete
                                  </button>
                                  <div className="grid grid-cols-2 gap-3">
                                    <input
                                      type="text"
                                      placeholder="Position"
                                      value={exp.position || ""}
                                      onChange={(e) => {
                                        const currentExp = [...(selectedResumeDetails.parsed_data?.experience || [])];
                                        currentExp[idx] = { ...currentExp[idx], position: e.target.value };
                                        setSelectedResumeDetails({
                                          ...selectedResumeDetails,
                                          parsed_data: {
                                            ...selectedResumeDetails.parsed_data,
                                            experience: currentExp
                                          }
                                        });
                                      }}
                                      className="input-premium py-2 text-xs bg-bg-raised"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Company"
                                      value={exp.company || ""}
                                      onChange={(e) => {
                                        const currentExp = [...(selectedResumeDetails.parsed_data?.experience || [])];
                                        currentExp[idx] = { ...currentExp[idx], company: e.target.value };
                                        setSelectedResumeDetails({
                                          ...selectedResumeDetails,
                                          parsed_data: {
                                            ...selectedResumeDetails.parsed_data,
                                            experience: currentExp
                                          }
                                        });
                                      }}
                                      className="input-premium py-2 text-xs bg-bg-raised"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <input
                                      type="text"
                                      placeholder="Start Date (e.g. 2021)"
                                      value={exp.start_date || ""}
                                      onChange={(e) => {
                                        const currentExp = [...(selectedResumeDetails.parsed_data?.experience || [])];
                                        currentExp[idx] = { ...currentExp[idx], start_date: e.target.value };
                                        setSelectedResumeDetails({
                                          ...selectedResumeDetails,
                                          parsed_data: {
                                            ...selectedResumeDetails.parsed_data,
                                            experience: currentExp
                                          }
                                        });
                                      }}
                                      className="input-premium py-2 text-xs bg-bg-raised"
                                    />
                                    <input
                                      type="text"
                                      placeholder="End Date (e.g. 2023)"
                                      value={exp.end_date || ""}
                                      onChange={(e) => {
                                        const currentExp = [...(selectedResumeDetails.parsed_data?.experience || [])];
                                        currentExp[idx] = { ...currentExp[idx], end_date: e.target.value };
                                        setSelectedResumeDetails({
                                          ...selectedResumeDetails,
                                          parsed_data: {
                                            ...selectedResumeDetails.parsed_data,
                                            experience: currentExp
                                          }
                                        });
                                      }}
                                      className="input-premium py-2 text-xs bg-bg-raised"
                                    />
                                  </div>
                                  <textarea
                                    placeholder="Description..."
                                    rows={3}
                                    value={exp.description || ""}
                                    onChange={(e) => {
                                      const currentExp = [...(selectedResumeDetails.parsed_data?.experience || [])];
                                      currentExp[idx] = { ...currentExp[idx], description: e.target.value };
                                      setSelectedResumeDetails({
                                        ...selectedResumeDetails,
                                        parsed_data: {
                                          ...selectedResumeDetails.parsed_data,
                                          experience: currentExp
                                        }
                                      });
                                    }}
                                    className="w-full px-3 py-2 bg-bg-raised border border-border rounded-xl text-text focus:outline-none focus:border-accent text-xs resize-none"
                                  />
                                  <div className="flex flex-col gap-2">
                                    <button
                                      type="button"
                                      disabled={rewritingActive && rewritingIndex === idx}
                                      onClick={() => handleRewriteBullet(exp.description || "", idx, exp.position)}
                                      className="self-start text-[10px] font-black uppercase tracking-wider text-accent bg-accent-soft hover:brightness-110 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                                    >
                                      {rewritingActive && rewritingIndex === idx ? (
                                        <>
                                          <Loader2 size={10} className="animate-spin" />
                                          <span>Rewriting...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles size={10} />
                                          <span>💡 Optimize with AI</span>
                                        </>
                                      )}
                                    </button>
                                    
                                    {rewritingIndex === idx && rewriteSuggestions.length > 0 && (
                                      <div className="bg-bg-raised border border-border/80 rounded-xl p-3 space-y-2 mt-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">AI Suggestions (Click one to select)</p>
                                        <div className="space-y-1.5">
                                          {rewriteSuggestions.map((suggestion, sIdx) => (
                                            <button
                                              key={sIdx}
                                              type="button"
                                              onClick={() => {
                                                const currentExp = [...(selectedResumeDetails.parsed_data?.experience || [])];
                                                currentExp[idx] = { ...currentExp[idx], description: suggestion };
                                                setSelectedResumeDetails({
                                                  ...selectedResumeDetails,
                                                  parsed_data: {
                                                    ...selectedResumeDetails.parsed_data,
                                                    experience: currentExp
                                                  }
                                                });
                                                setRewriteSuggestions([]);
                                                setRewritingIndex(null);
                                              }}
                                              className="w-full text-left p-2.5 rounded-lg border border-border hover:border-accent bg-bg-surface text-[11px] text-text font-medium leading-relaxed hover:bg-accent-soft transition-all"
                                            >
                                              {suggestion}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const currentExp = selectedResumeDetails.parsed_data?.experience || [];
                                  setSelectedResumeDetails({
                                    ...selectedResumeDetails,
                                    parsed_data: {
                                      ...selectedResumeDetails.parsed_data,
                                      experience: [...currentExp, { position: "", company: "", start_date: "", end_date: "", description: "" }]
                                    }
                                  });
                                }}
                                className="w-full py-2 border border-dashed border-border hover:border-accent/40 rounded-xl text-xs font-bold uppercase tracking-wider text-text-muted hover:text-text transition-all"
                              >
                                + Add Work Experience
                              </button>
                            </div>
                          )}

                          {editorTab === "projects" && (
                            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                              {(selectedResumeDetails.parsed_data?.projects || []).map((proj: any, idx: number) => (
                                <div key={idx} className="border border-border/60 rounded-xl p-4 bg-bg-raised/20 space-y-3 relative">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentProj = selectedResumeDetails.parsed_data?.projects || [];
                                      setSelectedResumeDetails({
                                        ...selectedResumeDetails,
                                        parsed_data: {
                                          ...selectedResumeDetails.parsed_data,
                                          projects: currentProj.filter((_: any, i: number) => i !== idx)
                                        }
                                      });
                                    }}
                                    className="absolute top-2 right-2 text-text-muted hover:text-red-500 font-bold text-sm"
                                  >
                                    Delete
                                  </button>
                                  <div className="grid grid-cols-2 gap-3">
                                    <input
                                      type="text"
                                      placeholder="Project Title"
                                      value={proj.title || ""}
                                      onChange={(e) => {
                                        const currentProj = [...(selectedResumeDetails.parsed_data?.projects || [])];
                                        currentProj[idx] = { ...currentProj[idx], title: e.target.value };
                                        setSelectedResumeDetails({
                                          ...selectedResumeDetails,
                                          parsed_data: {
                                            ...selectedResumeDetails.parsed_data,
                                            projects: currentProj
                                          }
                                        });
                                      }}
                                      className="input-premium py-2 text-xs bg-bg-raised"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Project Link"
                                      value={proj.link || ""}
                                      onChange={(e) => {
                                        const currentProj = [...(selectedResumeDetails.parsed_data?.projects || [])];
                                        currentProj[idx] = { ...currentProj[idx], link: e.target.value };
                                        setSelectedResumeDetails({
                                          ...selectedResumeDetails,
                                          parsed_data: {
                                            ...selectedResumeDetails.parsed_data,
                                            projects: currentProj
                                          }
                                        });
                                      }}
                                      className="input-premium py-2 text-xs bg-bg-raised"
                                    />
                                  </div>
                                  <textarea
                                    placeholder="Project Description..."
                                    rows={3}
                                    value={proj.description || ""}
                                    onChange={(e) => {
                                      const currentProj = [...(selectedResumeDetails.parsed_data?.projects || [])];
                                      currentProj[idx] = { ...currentProj[idx], description: e.target.value };
                                      setSelectedResumeDetails({
                                        ...selectedResumeDetails,
                                        parsed_data: {
                                          ...selectedResumeDetails.parsed_data,
                                          projects: currentProj
                                        }
                                      });
                                    }}
                                    className="w-full px-3 py-2 bg-bg-raised border border-border rounded-xl text-text focus:outline-none focus:border-accent text-xs resize-none"
                                  />
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const currentProj = selectedResumeDetails.parsed_data?.projects || [];
                                  setSelectedResumeDetails({
                                    ...selectedResumeDetails,
                                    parsed_data: {
                                      ...selectedResumeDetails.parsed_data,
                                      projects: [...currentProj, { title: "", link: "", description: "" }]
                                    }
                                  });
                                }}
                                className="w-full py-2 border border-dashed border-border hover:border-accent/40 rounded-xl text-xs font-bold uppercase tracking-wider text-text-muted hover:text-text transition-all"
                              >
                                + Add Project
                              </button>
                            </div>
                          )}

                          {editorTab === "education" && (
                            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                              {(selectedResumeDetails.parsed_data?.education || []).map((edu: any, idx: number) => (
                                <div key={idx} className="border border-border/60 rounded-xl p-4 bg-bg-raised/20 space-y-3 relative">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentEdu = selectedResumeDetails.parsed_data?.education || [];
                                      setSelectedResumeDetails({
                                        ...selectedResumeDetails,
                                        parsed_data: {
                                          ...selectedResumeDetails.parsed_data,
                                          education: currentEdu.filter((_: any, i: number) => i !== idx)
                                        }
                                      });
                                    }}
                                    className="absolute top-2 right-2 text-text-muted hover:text-red-500 font-bold text-sm"
                                  >
                                    Delete
                                  </button>
                                  <div className="grid grid-cols-2 gap-3">
                                    <input
                                      type="text"
                                      placeholder="Degree"
                                      value={edu.degree || ""}
                                      onChange={(e) => {
                                        const currentEdu = [...(selectedResumeDetails.parsed_data?.education || [])];
                                        currentEdu[idx] = { ...currentEdu[idx], degree: e.target.value };
                                        setSelectedResumeDetails({
                                          ...selectedResumeDetails,
                                          parsed_data: {
                                            ...selectedResumeDetails.parsed_data,
                                            education: currentEdu
                                          }
                                        });
                                      }}
                                      className="input-premium py-2 text-xs bg-bg-raised"
                                    />
                                    <input
                                      type="text"
                                      placeholder="School/University"
                                      value={edu.school || ""}
                                      onChange={(e) => {
                                        const currentEdu = [...(selectedResumeDetails.parsed_data?.education || [])];
                                        currentEdu[idx] = { ...currentEdu[idx], school: e.target.value };
                                        setSelectedResumeDetails({
                                          ...selectedResumeDetails,
                                          parsed_data: {
                                            ...selectedResumeDetails.parsed_data,
                                            education: currentEdu
                                          }
                                        });
                                      }}
                                      className="input-premium py-2 text-xs bg-bg-raised"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <input
                                      type="text"
                                      placeholder="Start Date"
                                      value={edu.start_date || ""}
                                      onChange={(e) => {
                                        const currentEdu = [...(selectedResumeDetails.parsed_data?.education || [])];
                                        currentEdu[idx] = { ...currentEdu[idx], start_date: e.target.value };
                                        setSelectedResumeDetails({
                                          ...selectedResumeDetails,
                                          parsed_data: {
                                            ...selectedResumeDetails.parsed_data,
                                            education: currentEdu
                                          }
                                        });
                                      }}
                                      className="input-premium py-2 text-xs bg-bg-raised"
                                    />
                                    <input
                                      type="text"
                                      placeholder="End Date"
                                      value={edu.end_date || ""}
                                      onChange={(e) => {
                                        const currentEdu = [...(selectedResumeDetails.parsed_data?.education || [])];
                                        currentEdu[idx] = { ...currentEdu[idx], end_date: e.target.value };
                                        setSelectedResumeDetails({
                                          ...selectedResumeDetails,
                                          parsed_data: {
                                            ...selectedResumeDetails.parsed_data,
                                            education: currentEdu
                                          }
                                        });
                                      }}
                                      className="input-premium py-2 text-xs bg-bg-raised"
                                    />
                                  </div>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const currentEdu = selectedResumeDetails.parsed_data?.education || [];
                                  setSelectedResumeDetails({
                                    ...selectedResumeDetails,
                                    parsed_data: {
                                      ...selectedResumeDetails.parsed_data,
                                      education: [...currentEdu, { degree: "", school: "", start_date: "", end_date: "" }]
                                    }
                                  });
                                }}
                                className="w-full py-2 border border-dashed border-border hover:border-accent/40 rounded-xl text-xs font-bold uppercase tracking-wider text-text-muted hover:text-text transition-all"
                              >
                                + Add Education
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Right Column: Live Styled Preview */}
                    <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                      <div className="flex items-center justify-between p-6 border-b border-border/60 bg-bg-raised/20">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Template Preview</span>
                          <span className="px-2 py-0.5 bg-accent-soft text-accent rounded-md text-[9px] font-bold uppercase tracking-wider">{selectedResumeDetails.template || "professional"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setIsEditing(!isEditing)}
                            className="px-3.5 py-1.5 bg-accent text-bg-surface hover:brightness-110 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all shadow-sm"
                          >
                            {isEditing ? "Close Editor" : "Open Editor"}
                          </button>
                          <button 
                            onClick={() => handleExportResume("pdf")}
                            className="px-3.5 py-1.5 border border-border hover:border-accent hover:text-accent rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all bg-bg-raised flex items-center gap-1.5 shadow-sm"
                          >
                            <Download size={10} />
                            <span>PDF</span>
                          </button>
                          <button 
                            onClick={() => handleExportResume("docx")}
                            className="px-3.5 py-1.5 border border-border hover:border-accent hover:text-accent rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all bg-bg-raised flex items-center gap-1.5 shadow-sm"
                          >
                            <Download size={10} />
                            <span>DOCX</span>
                          </button>
                        </div>
                      </div>

                      {/* Template Selector Bar */}
                      <div className="flex items-center gap-2 px-6 py-3 bg-bg-raised/10 border-b border-border/40 overflow-x-auto whitespace-nowrap scrollbar-none">
                        {TEMPLATE_META.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setSelectedResumeDetails((prev: any) => ({ ...prev, template: t.id }));
                              handleSaveTemplateChoice(t.id);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                              selectedResumeDetails.template === t.id
                                ? "bg-accent-soft/30 border-accent text-accent"
                                : "bg-bg-raised/40 border-border text-text-muted hover:text-text"
                            }`}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>

                      {/* Scale wrapper for preview */}
                      <div className="p-8 flex justify-center bg-bg-raised/10 overflow-y-auto max-h-[800px] border-b border-border/30">
                        <div className="shadow-2xl border border-border/80 rounded bg-white overflow-hidden" style={{ minWidth: 794 }}>
                          <TemplateRenderer
                            templateId={selectedResumeDetails.template || "professional"}
                            data={{
                              title: selectedResumeDetails.title || selectedResumeDetails.filename || "Professional Resume",
                              summary: selectedResumeDetails.summary || "",
                              skills: selectedResumeDetails.parsed_data?.skills || [],
                              experience: selectedResumeDetails.parsed_data?.experience || [],
                              education: selectedResumeDetails.parsed_data?.education || [],
                              projects: selectedResumeDetails.parsed_data?.projects || [],
                              certifications: selectedResumeDetails.parsed_data?.certifications || [],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-8">

                {/* ── LinkedIn URL Hero (Kickresume-style) ───────────────── */}
                <div className="relative rounded-3xl overflow-hidden border border-border bg-bg-surface">
                  {/* Accent glow strip */}
                  <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--accent) 0%, var(--accent-soft) 60%, transparent 100%)" }} />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                    {/* Left — main import area */}
                    <div className="lg:col-span-3 p-10 lg:p-14">
                      <div className="flex items-center gap-2 mb-5">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">LinkedIn Import</span>
                      </div>
                      <h2 className="text-3xl lg:text-4xl font-black text-text leading-tight mb-3">
                        Got LinkedIn?<br />
                        <span style={{ color: "var(--accent)" }}>Turn your profile into a resume fast.</span>
                      </h2>
                      <p className="text-sm text-text-muted mb-8 max-w-md leading-relaxed">
                        Your LinkedIn profile already contains most of what you need. Paste your LinkedIn profile URL and we&apos;ll guide you to export and import it in seconds.
                      </p>

                      {/* URL input row */}
                      <div className="flex gap-3 flex-col sm:flex-row">
                        <input
                          type="url"
                          id="linkedin-url-input"
                          placeholder="linkedin.com/in/your-profile"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          className="flex-1 px-5 py-4 bg-bg rounded-2xl border-2 border-border focus:outline-none focus:border-accent text-sm font-medium text-text placeholder:text-text-muted/50 transition-all"
                        />
                        <button
                          id="linkedin-continue-btn"
                          type="button"
                          onClick={() => setShowLinkedInPdfModal(true)}
                          className="px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider text-bg-surface transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                          style={{ background: "var(--accent)" }}
                        >
                          Continue →
                        </button>
                      </div>
                      <p className="text-[10px] text-text-muted mt-3 font-medium">— or — <button onClick={() => setShowLinkedInPdfModal(true)} className="underline text-accent font-bold hover:no-underline">upload your LinkedIn PDF directly</button></p>
                    </div>

                    {/* Right — social proof / benefits panel */}
                    <div className="lg:col-span-2 bg-bg-raised/60 border-l border-border p-10 flex flex-col justify-center gap-6">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Why import from LinkedIn?</p>
                      {[
                        { icon: "⚡", title: "Instant setup", desc: "Your work history, skills and education auto-imported" },
                        { icon: "🎯", title: "ATS-optimised", desc: "AI structures your profile to beat applicant tracking systems" },
                        { icon: "✨", title: "AI enhanced", desc: "We improve bullet points and add missing keywords automatically" },
                      ].map((b) => (
                        <div key={b.title} className="flex items-start gap-3">
                          <span className="text-xl">{b.icon}</span>
                          <div>
                            <p className="text-sm font-black text-text leading-tight">{b.title}</p>
                            <p className="text-[11px] text-text-muted leading-snug mt-0.5">{b.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LinkedIn PDF Import Modal */}
                <AnimatePresence>
                  {showLinkedInPdfModal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center p-4"
                      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
                      onClick={(e) => { if (e.target === e.currentTarget) setShowLinkedInPdfModal(false); }}
                    >
                      <motion.div
                        initial={{ scale: 0.92, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.92, y: 20, opacity: 0 }}
                        transition={{ type: "spring", damping: 22, stiffness: 300 }}
                        className="w-full max-w-lg bg-bg-surface rounded-3xl border border-border overflow-hidden shadow-2xl"
                      >
                        <div className="h-1" style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-soft))" }} />
                        <div className="p-8">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-text">Import LinkedIn Profile</h3>
                            <button onClick={() => setShowLinkedInPdfModal(false)} className="w-8 h-8 rounded-full bg-bg-raised flex items-center justify-center text-text-muted hover:text-text transition-colors">✕</button>
                          </div>

                          {/* Tabs: PDF upload vs paste text */}
                          <div className="grid grid-cols-2 gap-3 mb-6">
                            <label
                              htmlFor="linkedin-pdf-upload"
                              className="relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed border-accent/30 bg-accent-soft/10 cursor-pointer hover:border-accent/60 hover:bg-accent-soft/20 transition-all group"
                            >
                              <input
                                id="linkedin-pdf-upload"
                                type="file"
                                accept=".pdf"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setShowLinkedInPdfModal(false);
                                    handleFileUpload(file);
                                  }
                                }}
                              />
                              <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload className="text-accent" size={20} />
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-black text-text">Upload LinkedIn PDF</p>
                                <p className="text-[10px] text-text-muted mt-0.5">Download from LinkedIn → Me → Settings → Get a copy</p>
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: "var(--accent)", color: "var(--bg-surface)" }}>Recommended</span>
                            </label>

                            <div className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed border-border bg-bg-raised/30">
                              <div className="w-10 h-10 rounded-xl bg-bg-raised flex items-center justify-center">
                                <FileText className="text-text-muted" size={20} />
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-black text-text">Paste Profile Text</p>
                                <p className="text-[10px] text-text-muted mt-0.5">Open LinkedIn, Ctrl+A to select all, Ctrl+C to copy</p>
                              </div>
                            </div>
                          </div>

                          {/* Paste text form */}
                          <form onSubmit={handleLinkedInImport} className="space-y-4">
                            <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1.5 block">Resume Title</label>
                              <input
                                type="text"
                                placeholder="e.g. My LinkedIn Resume"
                                value={linkedinTitle}
                                onChange={(e) => setLinkedinTitle(e.target.value)}
                                className="w-full px-4 py-3 bg-bg rounded-xl border border-border focus:outline-none focus:border-accent text-sm font-medium text-text placeholder:text-text-muted/50 transition-all"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1.5 block">Paste Profile Text</label>
                              <textarea
                                rows={7}
                                placeholder="Open your LinkedIn profile → Ctrl+A (select all) → Ctrl+C (copy) → Ctrl+V (paste here)"
                                value={linkedinText}
                                onChange={(e) => setLinkedinText(e.target.value)}
                                className="w-full px-4 py-3 bg-bg rounded-xl border border-border focus:outline-none focus:border-accent text-xs text-text placeholder:text-text-muted/40 resize-none transition-all"
                                required
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={importingLinkedIn || !linkedinText.trim() || !linkedinTitle.trim()}
                              className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider text-bg-surface transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2"
                              style={{ background: "var(--accent)" }}
                            >
                              {importingLinkedIn ? <><Loader2 className="animate-spin" size={16} /> Parsing...</> : <><Sparkles size={14} /> Import Profile</>}
                            </button>
                          </form>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Two options: Upload + AI Synthesize ─────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Upload Card */}
                  <div
                    id="resume-upload-card"
                    onClick={() => document.getElementById('resume-upload')?.click()}
                    className="group relative rounded-3xl border-2 border-dashed border-border bg-bg-surface p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent/50 hover:bg-bg-raised/20 transition-all"
                  >
                    <input
                      id="resume-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                    <div className={`w-20 h-20 bg-accent-soft rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${ uploading ? "animate-pulse" : "" }`}>
                      <Upload className="text-accent" size={32} />
                    </div>
                    <h3 className="text-xl font-black text-text mb-2">{uploading ? "Analyzing your resume..." : "Upload Existing Resume"}</h3>
                    <p className="text-sm text-text-muted max-w-xs leading-relaxed">Already have a resume? Upload your PDF or Word doc and we&apos;ll parse & score it instantly.</p>
                    <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-text-muted">
                      <span className="px-3 py-1 rounded-full border border-border bg-bg-raised">PDF</span>
                      <span className="px-3 py-1 rounded-full border border-border bg-bg-raised">DOCX</span>
                      <span className="text-text-muted/50">Max 5MB</span>
                    </div>
                  </div>

                  {/* AI Synthesize Card */}
                  <form onSubmit={handleSynthesizeResume} className="group relative rounded-3xl border border-border bg-bg-surface p-10 flex flex-col justify-between hover:border-accent/30 transition-all">
                    <div>
                      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{ background: "var(--accent-soft)" }}>
                        <Sparkles className="text-accent" size={32} />
                      </div>
                      <h3 className="text-xl font-black text-text mb-2">Generate with AI</h3>
                      <p className="text-sm text-text-muted leading-relaxed mb-8">We combine your AmiSync profile + GitHub repositories to craft an ATS-optimised resume tailored to the role you want.</p>

                      <div className="space-y-5">
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1.5 block">Target Job Role</label>
                          <input
                            type="text"
                            placeholder="e.g. Senior Frontend Developer"
                            value={targetJob}
                            onChange={(e) => setTargetJob(e.target.value)}
                            className="w-full px-4 py-3.5 bg-bg rounded-xl border border-border focus:outline-none focus:border-accent text-sm font-medium text-text placeholder:text-text-muted/50 transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2 block">Layout Style</label>
                          <div className="grid grid-cols-2 gap-3">
                            {templates.map((t) => (
                              <div
                                key={t.id}
                                onClick={() => setSelectedTemplate(t.id)}
                                className={`border-2 rounded-2xl p-3 cursor-pointer transition-all ${
                                  selectedTemplate === t.id
                                    ? "border-accent bg-accent-soft/20"
                                    : "border-border hover:border-accent/40 bg-bg-raised/30"
                                }`}
                              >
                                <div className="w-full h-14 bg-bg-raised rounded-xl mb-2.5 overflow-hidden border border-border">
                                  {t.preview}
                                </div>
                                <p className="text-xs font-black text-text capitalize">{t.name}</p>
                                <p className="text-[9px] text-text-muted mt-0.5 line-clamp-1">{t.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl border border-border bg-bg-raised px-4 py-3.5">
                          <div>
                            <p className="text-xs font-black text-text">Enrich with GitHub</p>
                            <p className="text-[10px] text-text-muted mt-0.5">{githubConnected ? "Include repository insights" : "Connect GitHub first in Settings"}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={enrichGithub && githubConnected}
                            disabled={!githubConnected}
                            onChange={(e) => setEnrichGithub(e.target.checked)}
                            className="w-5 h-5 rounded border-border accent-accent focus:ring-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={synthesizing || !targetJob.trim()}
                      className="mt-8 w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider text-bg-surface transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2"
                      style={{ background: "var(--accent)" }}
                    >
                      {synthesizing ? <><Loader2 className="animate-spin" size={16} /> Synthesizing...</> : <><Sparkles size={16} /> Synthesize Resume</>}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* List */}
            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Saved Resumes</h3>
                  <span className="text-[10px] font-bold text-accent">{resumes.length} Found</span>
               </div>
               
               {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4 text-text-muted/20">
                     <div className="w-10 h-10 border-2 border-current border-t-transparent rounded-full animate-spin" />
                     <p className="text-[10px] font-black uppercase tracking-widest">Syncing resumes...</p>
                  </div>
               ) : resumes.length === 0 ? (
                  <div className="py-20 text-center glass-card border-dashed border-border">
                     <p className="text-sm font-bold text-text-muted">No resumes found.</p>
                  </div>
               ) : (
                  <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: { transition: { staggerChildren: 0.05 } }
                    }}
                    className="grid grid-cols-1 gap-4"
                  >
                    {resumes.map((resume) => (
                      <ResumeCard 
                        key={resume.id} 
                        resume={resume} 
                        onSelect={() => {
                          setSelectedResume(resume);
                          fetchAnalysis(resume.id);
                          fetchResumeDetails(resume.id);
                          setActiveTab("preview");
                        }}
                      />
                    ))}
                  </motion.div>
               )}
            </div>
          </div>

          {/* Sidebar Analysis */}
          <div className="lg:col-span-4">
             <AnimatePresence mode="wait">
                {selectedResume ? (
                   <motion.div
                     key={selectedResume.id}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="glass-card p-8 sticky top-32 space-y-10"
                   >
                      <div className="flex items-center justify-between">
                         <div className="p-3 bg-accent-soft rounded-2xl text-accent">
                            <Sparkles size={20} />
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Intelligence</p>
                            <p className="text-xs font-bold text-accent">Real-time Analysis</p>
                         </div>
                      </div>

                      <div className="flex justify-center py-4">
                         <ATSGauge score={atsScore} size={220} />
                      </div>

                      <div className="space-y-6">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">AI Insights</h4>
                         <div className="space-y-4">
                            {insights.map((insight, i) => (
                               <div key={i} className="flex gap-4 group">
                                  <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                    insight.type === 'error' ? 'bg-red-500' : 'bg-accent'
                                  }`} />
                                  <p className="text-xs font-medium text-text leading-relaxed">{insight.text}</p>
                               </div>
                            ))}
                         </div>
                          <button 
                            onClick={handleOptimizeResume}
                            disabled={optimizing}
                            className="w-full btn-premium !py-4 shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                             {optimizing ? (
                               <Loader2 className="animate-spin" size={16} />
                             ) : (
                               <Sparkles size={16} />
                             )}
                             <span>{optimizing ? "Optimizing..." : "Fix with AI"}</span>
                          </button>
                      </div>

                      {/* JD Paste & Tailor Card Section */}
                      {selectedResumeDetails && (
                        <div className="border-t border-border/60 pt-6 space-y-4 text-left">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Tailor to Job Description</h4>
                          <form onSubmit={handleTailorResume} className="space-y-3">
                            <textarea
                              rows={4}
                              value={jobDescription}
                              onChange={(e) => setJobDescription(e.target.value)}
                              placeholder="Paste the target job description here..."
                              className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-xs text-text focus:outline-none focus:border-accent resize-none placeholder:text-text-muted/40"
                              required
                            />
                            <button
                              type="submit"
                              disabled={tailoring || !jobDescription.trim()}
                              className="w-full py-3 bg-accent-soft hover:brightness-110 border border-accent/20 rounded-xl text-[10px] font-black uppercase tracking-wider text-accent transition-all flex items-center justify-center gap-2"
                            >
                              {tailoring ? (
                                <>
                                  <Loader2 className="animate-spin" size={12} />
                                  <span>Analyzing JD...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles size={12} />
                                  <span>Tailor My Resume</span>
                                </>
                              )}
                            </button>
                          </form>
                        </div>
                      )}
                   </motion.div>
                ) : (
                   <div className="glass-card p-8 text-center text-text-muted h-[400px] flex flex-col items-center justify-center gap-4">
                      <FileText size={40} className="opacity-10" />
                      <p className="text-xs font-bold uppercase tracking-widest">Select a node to analyze</p>
                   </div>
                )}
             </AnimatePresence>
          </div>
        </div>
      </div>

      {/* JD Tailor Suggestions Modal */}
      <AnimatePresence>
        {showTailorModal && tailorResults && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="w-full max-w-3xl bg-bg-surface rounded-3xl border border-border overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="h-1 bg-gradient-to-r from-accent to-accent-soft" />
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-border/60 text-left">
                <div>
                  <h3 className="text-lg font-black text-text uppercase tracking-wide">Review Tailoring Suggestions</h3>
                  <p className="text-[11px] text-text-muted mt-0.5">Gemini has optimized your resume for this specific job description.</p>
                </div>
                <button onClick={() => setShowTailorModal(false)} className="w-8 h-8 rounded-full bg-bg-raised flex items-center justify-center text-text-muted hover:text-text">✕</button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
                {/* Match Score comparison */}
                <div className="grid grid-cols-2 gap-4 bg-bg-raised/40 p-4 rounded-2xl border border-border/60">
                  <div className="text-center p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Current Match Score</p>
                    <p className="text-3xl font-display font-black text-red-500">{tailorResults.jd_match_score}%</p>
                  </div>
                  <div className="text-center p-3 border-l border-border/40">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Potential Match Score</p>
                    <p className="text-3xl font-display font-black text-emerald-500">{tailorResults.jd_match_score_after}%</p>
                  </div>
                </div>

                {/* Summary Compare */}
                {tailorResults.rewritten_summary && (
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Summary Comparison</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-border bg-bg-raised/20">
                        <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1.5">Original Summary</p>
                        <p className="text-xs text-text-muted leading-relaxed">{selectedResumeDetails?.summary}</p>
                      </div>
                      <div className="p-4 rounded-xl border border-accent/30 bg-accent-soft/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-accent mb-1.5">Rewritten Summary</p>
                        <p className="text-xs text-text leading-relaxed">{tailorResults.rewritten_summary}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills Suggestions */}
                {tailorResults.suggested_skills?.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Suggested Skills to Add</h4>
                    <div className="flex flex-wrap gap-2">
                      {tailorResults.suggested_skills.map((skill: string, index: number) => (
                        <span key={index} className="px-2.5 py-1 bg-accent-soft/30 border border-accent/20 text-accent rounded-lg text-xs font-semibold">
                          + {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Keywords */}
                {tailorResults.missing_keywords?.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Missing Job Description Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {tailorResults.missing_keywords.map((kw: string, index: number) => (
                        <span key={index} className="px-2.5 py-1 bg-bg-raised border border-border text-text-muted rounded-lg text-xs font-semibold">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience Changes */}
                {tailorResults.rewritten_experience?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Optimized Work Bullet Points</h4>
                    <div className="space-y-3">
                      {tailorResults.rewritten_experience.map((exp: any, index: number) => {
                        const origExp = selectedResumeDetails?.parsed_data?.experience?.[index];
                        if (!origExp || origExp.description === exp.description) return null;
                        return (
                          <div key={index} className="border border-border/80 rounded-xl p-4 space-y-3 bg-bg-raised/10">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-text uppercase tracking-wide">{exp.position} at {exp.company}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-left">
                              <div className="p-3 bg-bg-raised/30 rounded-lg text-text-muted line-through border border-border/40">
                                {origExp.description}
                              </div>
                              <div className="p-3 bg-accent-soft/10 rounded-lg text-text border border-accent/20">
                                {exp.description}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-border/60 bg-bg-raised/20 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowTailorModal(false)}
                  className="px-5 py-2.5 border border-border hover:border-text rounded-xl text-xs font-black uppercase tracking-wider text-text-muted hover:text-text transition-colors"
                >
                  Discard Suggestions
                </button>
                <button
                  onClick={handleApplyTailoredChanges}
                  className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-bg-surface rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md animate-pulse"
                >
                  Apply Suggestions
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

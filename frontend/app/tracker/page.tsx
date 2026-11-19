"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Plus,
  Loader2,
  Sparkles,
  MapPin,
  Trash2,
  FileText,
  AlertCircle,
  TrendingUp
} from "lucide-react";

interface Application {
  id: number;
  job_id: number;
  job_title: string;
  company: string;
  location: string;
  status: string;
  ai_match_score: number;
  applied_at: string | null;
  last_updated: string | null;
  interview_scheduled: string | null;
  notes: string | null;
}

const COLUMNS = [
  { id: "pending", label: "Wishlist", color: "border-t-slate-400 bg-slate-500/5", textColor: "text-slate-400" },
  { id: "applied", label: "Applied", color: "border-t-indigo-400 bg-indigo-500/5", textColor: "text-indigo-400" },
  { id: "interview", label: "Interviewing", color: "border-t-amber-400 bg-amber-500/5", textColor: "text-amber-400" },
  { id: "accepted", label: "Offers", color: "border-t-emerald-400 bg-emerald-500/5", textColor: "text-emerald-400" },
];

export default function TrackerPage() {
  const { token } = useAuth() as any;
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [appNotes, setAppNotes] = useState("");

  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const apiBase = rawApiUrl.endsWith("/api/v1") ? rawApiUrl : `${rawApiUrl}/api/v1`;

  const fetchApplications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data || []);
      }
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [token]);

  const updateStatus = async (appId: number, nextStatus: string) => {
    try {
      const res = await fetch(`${apiBase}/applications/${appId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setApplications((prev) =>
          prev.map((app) => (app.id === appId ? { ...app, status: nextStatus, last_updated: new Date().toISOString() } : app))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleOpenDetails = (app: Application) => {
    setSelectedApp(app);
    setAppNotes(app.notes || "");
    setInterviewDate(app.interview_scheduled ? app.interview_scheduled.slice(0, 16) : "");
  };

  const handleSaveDetails = async () => {
    if (!selectedApp) return;
    setModalLoading(true);
    try {
      const res = await fetch(`${apiBase}/applications/${selectedApp.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: selectedApp.status,
          notes: appNotes,
          interview_scheduled: interviewDate ? new Date(interviewDate).toISOString() : null
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setApplications((prev) =>
          prev.map((app) =>
            app.id === selectedApp.id
              ? {
                  ...app,
                  notes: updated.notes,
                  interview_scheduled: updated.interview_scheduled,
                  last_updated: updated.last_updated
                }
              : app
          )
        );
        setSelectedApp(null);
      }
    } catch (err) {
      console.error("Failed to save application details:", err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteApplication = async (appId: number) => {
    if (!confirm("Are you sure you want to remove this job tracker entry?")) return;
    try {
      await updateStatus(appId, "withdrawn");
      setSelectedApp(null);
    } catch (err) {
      console.error("Failed to remove application:", err);
    }
  };

  const moveCard = (app: Application, direction: "left" | "right") => {
    const currentIndex = COLUMNS.findIndex((c) => c.id === app.status);
    if (currentIndex === -1) return;
    const nextIndex = direction === "right" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < COLUMNS.length) {
      updateStatus(app.id, COLUMNS[nextIndex].id);
    }
  };

  return (
    <DashboardLayout title="Tracker">
      <div className="space-y-8 h-full flex flex-col">
        {/* Header */}
        <div className="pb-6 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-text mb-1">Application Tracker</h1>
            <p className="text-text-muted text-sm font-medium">
              Manage your job search pipeline. Click arrows to shift statuses, and edit logs.
            </p>
          </div>
          <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
            <span className="flex items-center gap-1"><Sparkles size={12} className="text-accent" /> AI MATCH POWERED</span>
          </div>
        </div>

        {loading ? (
          <div className="flex-grow flex flex-col items-center justify-center gap-4 py-20 text-text-muted">
            <Loader2 size={36} className="animate-spin text-accent" />
            <p className="text-xs font-black uppercase tracking-widest">Loading Pipeline...</p>
          </div>
        ) : (
          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-6">
            {COLUMNS.map((col) => {
              const colApps = applications.filter((app) => app.status === col.id);
              return (
                <div
                  key={col.id}
                  className={`rounded-3xl border border-border/60 p-6 flex flex-col h-[70vh] min-w-[250px] transition-all border-t-4 ${col.color}`}
                >
                  {/* Column Header */}
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-text">
                      {col.label}
                    </h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md bg-bg-raised border border-border ${col.textColor}`}>
                      {colApps.length}
                    </span>
                  </div>

                  {/* Column Cards */}
                  <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                    {colApps.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-2xl p-6 text-center text-text-muted/30">
                        <Briefcase size={24} className="mb-2" />
                        <p className="text-[9px] font-black uppercase tracking-wider">Empty stage</p>
                      </div>
                    ) : (
                      colApps.map((app) => (
                        <motion.div
                          key={app.id}
                          layoutId={String(app.id)}
                          onClick={() => handleOpenDetails(app)}
                          className="glass-card !p-5 bg-bg-surface hover:border-accent/40 cursor-pointer group transition-all relative overflow-hidden"
                          whileHover={{ y: -2 }}
                        >
                          {/* AI Match Badge */}
                          {app.ai_match_score > 0 && (
                            <div className="absolute top-2 right-2 text-[8px] font-black px-1.5 py-0.5 rounded bg-accent-soft text-accent uppercase tracking-tighter">
                              {Math.round(app.ai_match_score)}% Match
                            </div>
                          )}

                          <div className="space-y-3">
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-wide text-text leading-tight group-hover:text-accent transition-colors max-w-[80%]">
                                {app.job_title}
                              </h4>
                              <p className="text-[10px] font-bold text-text-muted/80 mt-1">{app.company}</p>
                            </div>

                            <div className="flex items-center gap-1 text-[9px] font-bold text-text-muted/50 uppercase">
                              <MapPin size={10} />
                              <span className="truncate max-w-[120px]">{app.location}</span>
                            </div>

                            {/* Scheduled Interview Date */}
                            {app.interview_scheduled && (
                              <div className="flex items-center gap-1.5 p-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-[9px] font-black uppercase tracking-wider">
                                <Calendar size={10} />
                                <span>{new Date(app.interview_scheduled).toLocaleDateString()}</span>
                              </div>
                            )}

                            {/* Move Card Arrows */}
                            <div className="flex justify-between items-center pt-2 border-t border-border/40 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                disabled={col.id === "pending"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveCard(app, "left");
                                }}
                                className="p-1.5 rounded-lg bg-bg-raised border border-border text-text-muted/60 hover:text-accent hover:border-accent/40 disabled:opacity-30 disabled:hover:text-text-muted disabled:hover:border-border"
                              >
                                <ArrowLeft size={10} />
                              </button>
                              <button
                                disabled={col.id === "accepted"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveCard(app, "right");
                                }}
                                className="p-1.5 rounded-lg bg-bg-raised border border-border text-text-muted/60 hover:text-accent hover:border-accent/40 disabled:opacity-30 disabled:hover:text-text-muted disabled:hover:border-border"
                              >
                                <ArrowRight size={10} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Details Modal */}
        <AnimatePresence>
          {selectedApp && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-bg-surface border border-border rounded-[2rem] p-8 shadow-2xl relative space-y-6"
              >
                <div>
                  <span className="text-[8px] font-black px-2.5 py-1 bg-accent-soft text-accent rounded-lg uppercase tracking-widest">
                    {selectedApp.status.toUpperCase()}
                  </span>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-text mt-4 leading-none">
                    {selectedApp.job_title}
                  </h2>
                  <p className="text-xs font-bold text-text-muted mt-2">{selectedApp.company} • {selectedApp.location}</p>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Interview Date picker */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar size={12} /> Schedule Interview
                    </label>
                    <input
                      type="datetime-local"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm text-sm"
                    />
                  </div>

                  {/* Custom Notes */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                      <FileText size={12} /> Custom Notes
                    </label>
                    <textarea
                      rows={4}
                      value={appNotes}
                      onChange={(e) => setAppNotes(e.target.value)}
                      placeholder="Add salary package details, contacts, or logs..."
                      className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text placeholder-text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-border/60">
                  <button
                    onClick={() => handleDeleteApplication(selectedApp.id)}
                    className="text-[9px] font-black text-red-500/60 hover:text-red-500 uppercase tracking-widest flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Remove Entry
                  </button>

                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setSelectedApp(null)}
                      className="px-6 py-3 border border-border rounded-xl text-[10px] font-black text-text-muted uppercase tracking-widest hover:bg-bg-raised hover:text-text transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDetails}
                      disabled={modalLoading}
                      className="px-6 py-3 bg-accent text-bg-surface rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 disabled:opacity-50"
                    >
                      {modalLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Mic,
  PencilLine,
  Sparkles,
  Square,
  Volume2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { getStoredToken } from "@/hooks/useAuth";

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = RAW_API_URL.endsWith("/api/v1")
  ? RAW_API_URL
  : `${RAW_API_URL}/api/v1`;

type Role = { id: string; label: string };

const FALLBACK_ROLES: Role[] = [
  { id: "junior_dev", label: "Junior Developer" },
  { id: "senior_dev", label: "Senior Developer" },
  { id: "fullstack", label: "Full Stack Engineer" },
  { id: "devops", label: "DevOps Engineer" },
  { id: "data_scientist", label: "Data Scientist" },
  { id: "product_manager", label: "Product Manager" },
  { id: "sales_executive", label: "Sales Executive" },
  { id: "marketing_specialist", label: "Marketing Specialist" },
  { id: "customer_support", label: "Customer Support Specialist" },
  { id: "hr_specialist", label: "HR Specialist" },
  { id: "registered_nurse", label: "Registered Nurse" },
  { id: "educator_teacher", label: "Educator / Teacher" },
  { id: "accountant", label: "Accountant" },
];

type AnswerMetrics = {
  contentRelevance: number;
  clarity: number;
  pacing: number;
  wpm: number;
  fillerCount: number;
  fillerWords: string[];
  tips: string;
  comment: string;
};

type Session = {
  sessionId: string;
  role: string;
  industry: string;
  totalQuestions: number;
  questionNumber: number;
  questionText: string;
  startedAt: number;
};

const authHeaders = (withJson = false): Record<string, string> => ({
  ...(withJson ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${getStoredToken()}`,
});

export default function InterviewsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState("senior_dev");
  const [selectedIndustry, setSelectedIndustry] = useState("Technology");
  const [answerMode, setAnswerMode] = useState<"voice" | "text">("voice");

  const [session, setSession] = useState<Session | null>(null);
  const [answer, setAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [metrics, setMetrics] = useState<AnswerMetrics | null>(null);
  const [finalReport, setFinalReport] = useState<any | null>(null);
  const [pastSessions, setPastSessions] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");

  // ── data loading ──────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/interviews/past-sessions`, {
        headers: authHeaders(),
      });
      if (res.ok) setPastSessions(await res.json());
    } catch {
      // History is non-critical — don't block the interview flow.
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [rolesRes, industriesRes] = await Promise.all([
          fetch(`${API_BASE}/interviews/available-roles`),
          fetch(`${API_BASE}/interviews/available-industries`),
        ]);
        if (!active) return;
        if (rolesRes.ok) {
          const data = await rolesRes.json();
          setRoles(data.roles || []);
        }
        if (industriesRes.ok) {
          const data = await industriesRes.json();
          setIndustries(data.industries || []);
        }
        if (!getStoredToken()) {
          setError("Please sign in first so your interview sessions can be saved.");
        }
        loadHistory();
      } catch {
        if (active) setError("Could not reach the server. Please check your connection and try again.");
      }
    })();
    return () => {
      active = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
    };
  }, [loadHistory]);

  // ── interview flow ────────────────────────────────────────────────
  const startSession = async () => {
    setLoading(true);
    setError(null);
    setMetrics(null);
    setFinalReport(null);
    try {
      const res = await fetch(`${API_BASE}/interviews/start-session`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          role: selectedRole,
          industry: selectedIndustry,
          interview_type: answerMode,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Could not start the interview.");
      }
      const data = await res.json();
      setSession({
        sessionId: data.session_id,
        role: data.role,
        industry: data.industry || selectedIndustry,
        totalQuestions: data.total_questions || 5,
        questionNumber: 1,
        questionText: data.current_question?.question_text || "",
        startedAt: Date.now(),
      });
      setAnswer("");
      transcriptRef.current = "";
    } catch (err: any) {
      setError(err.message || "Could not start the interview.");
    } finally {
      setLoading(false);
    }
  };

  const stopRecording = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try { rec.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsRecording(false);
    const text = transcriptRef.current.trim();
    if (text.length >= 5) {
      submitAnswer(text);
    } else {
      setError("We didn't catch that. Try speaking a little longer, or switch to text mode.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, metrics]);

  const startRecording = () => {
    setError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input isn't supported in this browser. Use text mode instead.");
      return;
    }
    transcriptRef.current = "";
    setAnswer("");
    setIsRecording(true);

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (event: any) => {
      let final = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += text;
        else interim += text;
      }
      const value = (final || interim).trim();
      transcriptRef.current = value;
      setAnswer(value);
    };
    rec.onerror = (event: any) => {
      setIsRecording(false);
      setError(
        event.error === "not-allowed"
          ? "Microphone permission was denied. Allow access or switch to text mode."
          : "Voice capture stopped unexpectedly. You can try again or use text mode."
      );
    };
    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setIsRecording(false);
      setError("Could not start the microphone. Please try again.");
    }
  };

  const submitAnswer = async (text: string) => {
    if (!session || !text || text.trim().length < 5) return;
    setLoading(true);
    setError(null);
    const duration = Math.max(1, Math.round((Date.now() - session.startedAt) / 1000));
    try {
      // Record delivery first: the respond call can end the session and build
      // the final report, which must include this answer's pacing/clarity.
      const deliveryRes = await fetch(`${API_BASE}/interviews/analyze-delivery`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          transcript: text,
          duration_seconds: duration,
          session_id: session.sessionId,
        }),
      });
      const delivery = deliveryRes.ok ? await deliveryRes.json() : {};

      const respondRes = await fetch(
        `${API_BASE}/interviews/sessions/${session.sessionId}/respond`,
        {
          method: "POST",
          headers: authHeaders(true),
          body: JSON.stringify({
            question_id: session.questionNumber,
            user_answer: text,
            answer_type: answerMode,
            duration_seconds: duration,
          }),
        }
      );

      if (!respondRes.ok) {
        const body = await respondRes.json().catch(() => ({}));
        throw new Error(body.detail || "Could not submit your answer.");
      }
      const data = await respondRes.json();
      const content = data.content_feedback || {};

      setMetrics({
        contentRelevance:
          content.content_relevance ??
          Math.round((data.feedback?.score_out_of_10 || 0) * 10),
        clarity: delivery.clarity_score ?? 0,
        pacing: delivery.pacing_score ?? 0,
        wpm: delivery.wpm ?? 0,
        fillerCount: delivery.filler_count ?? 0,
        fillerWords: delivery.filler_words_found || [],
        tips: delivery.tips || "",
        comment: content.overall_comment || data.feedback?.overall_comment || "",
      });

      setAnswer("");
      transcriptRef.current = "";

      if (data.status === "interview_complete") {
        // The respond endpoint already generated and saved the final report.
        setFinalReport(
          data.report || {
            role: session.role,
            industry: session.industry,
            overall_score: data.overall_score,
            score_rating: data.score_rating,
            metrics_summary: data.metrics_summary,
          }
        );
        setSession(null);
        loadHistory();
      } else {
        setSession((prev) =>
          prev
            ? {
                ...prev,
                questionNumber: (data.questions_answered || prev.questionNumber) + 1,
                questionText: data.next_question || prev.questionText,
                startedAt: Date.now(),
              }
            : prev
        );
      }
    } catch (err: any) {
      setError(err.message || "Could not submit your answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const endEarly = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/interviews/sessions/${session.sessionId}/end-interview`,
        { method: "POST", headers: authHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        setFinalReport(data.report);
      }
      setSession(null);
      setMetrics(null);
      loadHistory();
    } catch {
      setError("Could not end the session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roleLabel =
    roles.find((r) => r.id === session?.role)?.label ||
    session?.role?.replace(/_/g, " ") ||
    "Interview";

  return (
    <DashboardLayout title="Interview Prep">
      <div className="mx-auto max-w-6xl space-y-10 pb-16">
        <header className="border-b border-border pb-8">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
            <Sparkles size={14} /> Interview Prep
          </p>
          <h1 className="font-display text-3xl font-black tracking-tight text-text md:text-5xl">
            Practice with confidence.
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-text-muted">
            Pick a role and industry, answer five tailored questions by voice or
            text, and get clear feedback on your content, clarity and pacing.
          </p>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-500">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {finalReport ? (
            /* ── Session summary ─────────────────────────────────── */
            <motion.section
              key="report"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-8"
            >
              <div className="rounded-3xl border border-border bg-bg-surface p-8 shadow-sm md:p-10">
                <div className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-8">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                      Session complete
                    </p>
                    <h2 className="mt-2 font-display text-3xl font-black text-text">
                      Nice work, keep it up.
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-text-muted">
                      {roleLabel}
                      {finalReport?.industry ? ` · ${finalReport.industry}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-black tracking-tight text-accent">
                      {finalReport?.overall_score ?? 0}
                      <span className="text-xl text-text-muted">/10</span>
                    </div>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                      {finalReport?.score_rating || "Complete"}
                    </p>
                  </div>
                </div>

                <MetricCards
                  values={finalReport?.metrics_summary}
                  fallback={metrics}
                />

                <div className="mt-10 grid gap-8 md:grid-cols-2">
                  <FeedbackList
                    title="What went well"
                    items={finalReport?.strengths || []}
                    tone="positive"
                  />
                  <FeedbackList
                    title="Where to improve"
                    items={finalReport?.improvements || []}
                    tone="warning"
                  />
                </div>

                {finalReport?.recommendation && (
                  <div className="mt-8 rounded-2xl border border-accent/20 bg-accent-soft p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
                      Recommendation
                    </p>
                    <p className="mt-1 text-sm font-bold text-text">
                      {finalReport.recommendation}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setFinalReport(null);
                    setMetrics(null);
                  }}
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-xs font-bold uppercase tracking-widest text-bg-surface transition hover:brightness-110"
                >
                  Practice again <ArrowRight size={15} />
                </button>
              </div>
            </motion.section>
          ) : session ? (
            /* ── Active question ─────────────────────────────────── */
            <motion.section
              key="active"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="mx-auto max-w-4xl space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 px-1">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                    {roleLabel} · {session.industry}
                  </span>
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-accent">
                  Question {session.questionNumber} of {session.totalQuestions}
                </span>
              </div>

              <div className="rounded-3xl border border-accent/20 bg-bg-surface p-8 text-center shadow-sm md:p-14">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                  Your question
                </p>
                <h2 className="mt-5 font-display text-2xl font-black leading-snug text-text md:text-4xl">
                  {session.questionText}
                </h2>
                {session.questionText?.startsWith("Initializing") && (
                  <p className="mt-4 text-xs font-semibold text-text-muted">
                    Generating a question tailored to your role and industry…
                  </p>
                )}
              </div>

              {metrics && (
                <div className="rounded-3xl border border-border bg-bg-surface p-6 md:p-8">
                  <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                    Feedback on your last answer
                  </p>
                  <MetricCards values={{
                    content_relevance: metrics.contentRelevance,
                    clarity: metrics.clarity,
                    pacing: metrics.pacing,
                    average_wpm: metrics.wpm,
                    filler_words_total: metrics.fillerCount,
                  }} />
                  {metrics.fillerWords.length > 0 && (
                    <p className="mt-5 text-xs font-semibold text-text-muted">
                      Filler words detected:{" "}
                      <span className="font-bold text-text">
                        {metrics.fillerWords.join(", ")}
                      </span>
                    </p>
                  )}
                  {metrics.tips && (
                    <p className="mt-3 text-xs font-semibold text-accent">{metrics.tips}</p>
                  )}
                  {metrics.comment && (
                    <p className="mt-3 text-sm font-medium leading-relaxed text-text">
                      {metrics.comment}
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-3xl border border-border bg-bg-surface p-6 md:p-8">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm font-bold text-text">Your answer</p>
                  <div className="flex rounded-xl border border-border bg-bg-raised p-1">
                    {(["voice", "text"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          if (isRecording) stopRecording();
                          setAnswerMode(mode);
                          setAnswer("");
                          transcriptRef.current = "";
                        }}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[11px] font-bold capitalize transition ${
                          answerMode === mode
                            ? "bg-accent text-bg-surface"
                            : "text-text-muted hover:text-text"
                        }`}
                      >
                        {mode === "voice" ? <Mic size={14} /> : <PencilLine size={14} />}
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {answerMode === "voice" ? (
                  <div className="flex flex-col items-center gap-6 py-6">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={loading}
                      className={`flex h-24 w-24 items-center justify-center rounded-full border-2 transition disabled:opacity-50 ${
                        isRecording
                          ? "border-transparent bg-accent text-bg-surface shadow-[0_0_50px_var(--accent-soft)]"
                          : "border-accent/30 bg-bg-raised text-accent hover:border-accent"
                      }`}
                      aria-label={isRecording ? "Stop recording" : "Start recording"}
                    >
                      {isRecording ? <Square size={30} /> : <Mic size={30} />}
                    </button>
                    <p className="text-xs font-bold text-text-muted">
                      {isRecording
                        ? "Listening… tap the square when you're done"
                        : "Tap the mic and speak your answer"}
                    </p>
                  </div>
                ) : (
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={6}
                    placeholder="Type your answer here…"
                    className="w-full rounded-2xl border border-border bg-bg-raised p-4 text-sm font-medium text-text outline-none transition focus:border-accent"
                  />
                )}

                {answer && !isRecording && (
                  <p className="mt-4 rounded-xl bg-bg-raised p-4 text-xs font-medium italic leading-relaxed text-text-muted">
                    “{answer}”
                  </p>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                  <button
                    onClick={endEarly}
                    disabled={loading}
                    className="text-xs font-bold uppercase tracking-widest text-text-muted transition hover:text-text disabled:opacity-50"
                  >
                    End session early
                  </button>
                  {answerMode === "text" && (
                    <button
                      onClick={() => submitAnswer(answer)}
                      disabled={loading || answer.trim().length < 5}
                      className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-xs font-bold uppercase tracking-widest text-bg-surface transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {loading ? "Submitting…" : "Submit answer"}
                      <ArrowRight size={15} />
                    </button>
                  )}
                </div>
              </div>
            </motion.section>
          ) : (
            /* ── Setup ───────────────────────────────────────────── */
            <motion.section
              key="setup"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              className="grid gap-8 lg:grid-cols-[1.6fr_1fr]"
            >
              <div className="rounded-3xl border border-border bg-bg-surface p-8 shadow-sm md:p-10">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent-soft text-accent">
                  <Volume2 size={26} />
                </div>
                <h2 className="font-display text-2xl font-black text-text md:text-3xl">
                  Set up your session
                </h2>
                <p className="mt-2 text-sm font-medium text-text-muted">
                  Questions are generated for your role and industry — so this
                  works whether you&apos;re in engineering, marketing or healthcare.
                </p>

                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-text-muted">
                      Target role
                    </span>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full rounded-xl border border-border bg-bg-raised px-4 py-3 text-sm font-semibold text-text outline-none focus:border-accent"
                    >
                      {(roles.length ? roles : FALLBACK_ROLES).map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-text-muted">
                      Industry
                    </span>
                    <input
                      list="industry-options"
                      value={selectedIndustry}
                      onChange={(e) => setSelectedIndustry(e.target.value)}
                      placeholder="e.g. Healthcare"
                      className="w-full rounded-xl border border-border bg-bg-raised px-4 py-3 text-sm font-semibold text-text outline-none focus:border-accent"
                    />
                    <datalist id="industry-options">
                      {industries.map((industry) => (
                        <option key={industry} value={industry} />
                      ))}
                    </datalist>
                  </label>
                </div>

                <div className="mt-6">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    How do you want to answer?
                  </span>
                  <div className="flex gap-3">
                    {(["voice", "text"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setAnswerMode(mode)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold capitalize transition ${
                          answerMode === mode
                            ? "border-accent bg-accent-soft text-accent"
                            : "border-border bg-bg-raised text-text-muted hover:text-text"
                        }`}
                      >
                        {mode === "voice" ? <Mic size={15} /> : <PencilLine size={15} />}
                        {mode === "voice" ? "Speak" : "Type"}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={startSession}
                  disabled={loading}
                  className="mt-8 inline-flex items-center gap-3 rounded-xl bg-accent px-7 py-4 text-xs font-bold uppercase tracking-widest text-bg-surface transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? "Preparing…" : "Start interview"}
                  <ArrowRight size={16} />
                </button>
              </div>

              <aside className="rounded-3xl border border-border bg-bg-surface p-8 shadow-sm">
                <div className="mb-6 flex items-center gap-2">
                  <Clock3 size={16} className="text-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-text">
                    Recent sessions
                  </h3>
                </div>
                {pastSessions.length === 0 ? (
                  <p className="py-10 text-center text-xs font-semibold text-text-muted">
                    No sessions yet. Your practice history will appear here.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {pastSessions.slice(0, 6).map((item) => (
                      <li
                        key={item.session_id || item._id}
                        className="flex items-center justify-between rounded-xl border border-border bg-bg-raised px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold capitalize text-text">
                            {(item.role || "Interview").replace(/_/g, " ")}
                          </p>
                          <p className="text-[10px] font-semibold text-text-muted">
                            {item.created_at
                              ? new Date(item.created_at).toLocaleDateString()
                              : "Completed"}
                          </p>
                        </div>
                        <span className="ml-3 shrink-0 text-sm font-black text-accent">
                          {item.overall_score ?? 0}/10
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </aside>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

/* ── Named metric cards ─────────────────────────────────────────────── */
function MetricCards({ values, fallback }: { values?: any; fallback?: AnswerMetrics | null }) {
  const cards = [
    {
      label: "Content Relevance",
      value: values?.content_relevance ?? fallback?.contentRelevance ?? 0,
      hint: "How well your answer addressed the question",
    },
    {
      label: "Clarity",
      value: values?.clarity ?? fallback?.clarity ?? 0,
      hint: "Filler words and clarity of expression",
    },
    {
      label: "Pacing",
      value: values?.pacing ?? fallback?.pacing ?? 0,
      hint: `${values?.average_wpm ?? fallback?.wpm ?? 0} words per minute`,
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-border bg-bg-raised p-5"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            {card.label}
          </p>
          <p className="mt-2 text-3xl font-black text-accent">{card.value}</p>
          <p className="mt-2 text-[11px] font-medium leading-snug text-text-muted">
            {card.hint}
          </p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${Math.min(100, Math.max(0, card.value))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function FeedbackList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "warning";
}) {
  const positive = tone === "positive";
  return (
    <div>
      <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text">
        {positive ? (
          <CheckCircle2 size={16} className="text-accent" />
        ) : (
          <Sparkles size={16} className="text-amber-500" />
        )}
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs font-medium text-text-muted">Nothing noted yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="text-sm font-medium text-text-muted">
              · {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

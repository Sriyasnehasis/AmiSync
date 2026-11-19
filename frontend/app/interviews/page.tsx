"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Mic, 
  Sparkles, 
  Zap, 
  Terminal, 
  Play, 
  Volume2, 
  RotateCcw,
  Activity
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function InterviewsPage() {
  const { token } = useAuth() as any;
  const [interviewActive, setInterviewActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("senior_dev");

  // Local speech processing states
  const [recognition, setRecognition] = useState<any>(null);
  const [transcript, setTranscript] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [speechMetrics, setSpeechMetrics] = useState({
    wpm: 0,
    fillerCount: 0,
    wordCount: 0,
    duration: 0
  });

  // History & Final Report States
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [finalReport, setFinalReport] = useState<any | null>(null);

  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const apiBase = rawApiUrl.endsWith("/api/v1") ? rawApiUrl : `${rawApiUrl}/api/v1`;

  const fetchPastSessions = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/interviews/past-sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPastSessions(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch past sessions:", err);
    }
  };

  useEffect(() => {
    fetchPastSessions();
  }, [token]);

  const handleStartInterview = async () => {
    setLoading(true);
    setFinalReport(null);
    setSpeechMetrics({ wpm: 0, fillerCount: 0, wordCount: 0, duration: 0 });
    setTranscript("");
    try {
      const res = await fetch(`${apiBase}/interviews/start-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: selectedRole, interview_type: "voice" }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSessionId(data.session_id);
      setCurrentQuestion(data.current_question);
      setInterviewActive(true);
    } catch (err) {
      alert("System Offline. Check Backend.");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = () => {
    setTranscript("");
    setIsRecording(true);
    setStartTime(Date.now());
    setFeedback(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Linguistic scanner offline: Speech Recognition API is not supported in this browser.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += trans;
          } else {
            interimTranscript += trans;
          }
        }
        
        const currentTrans = finalTranscript || interimTranscript;
        setTranscript(currentTrans);

        // Update real-time metrics
        const words = currentTrans.trim().split(/\s+/).filter(Boolean);
        const wordCount = words.length;
        const durationSec = startTime ? Math.max(1, Math.round((Date.now() - startTime) / 1000)) : 1;
        const wpmVal = Math.round((wordCount / durationSec) * 60);

        // Count filler words locally
        const fillerWordsList = ["um", "uh", "like", "you know", "actually", "basically"];
        let fillerCount = 0;
        const lowerTrans = currentTrans.toLowerCase();
        fillerWordsList.forEach(word => {
          if (word === "you know") {
            const matches = lowerTrans.match(/you know/g);
            if (matches) fillerCount += matches.length;
          } else {
            const regex = new RegExp(`\\b${word}\\b`, "g");
            const matches = lowerTrans.match(regex);
            if (matches) fillerCount += matches.length;
          }
        });

        setSpeechMetrics({
          wpm: wpmVal,
          fillerCount,
          wordCount,
          duration: durationSec
        });
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
      };

      rec.start();
      setRecognition(rec);
    } catch (err) {
      console.error("Error starting speech recognition:", err);
    }
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsRecording(false);
    
    // Ensure we submit the transcript
    if (transcript.trim().length > 4) {
      submitAnswer(transcript);
    } else {
      alert("Scanner signal too weak. Please speak more clearly or provide a longer answer.");
    }
  };

  const submitAnswer = async (transText: string) => {
    if (!sessionId || !transText) return;
    setLoading(true);
    try {
      // 🎤 Call delivery analysis in parallel with content scoring
      const [res, deliveryRes] = await Promise.all([
        fetch(`${apiBase}/interviews/sessions/${sessionId}/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            question_id: currentQuestion?.question_id || 0,
            user_answer: transText,
            answer_type: "voice",
            duration_seconds: speechMetrics.duration
          }),
        }),
        fetch(`${apiBase}/interviews/analyze-delivery`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            transcript: transText,
            duration_seconds: Math.max(speechMetrics.duration, 1),
            session_id: sessionId,
          }),
        }),
      ]);

      // Update delivery metrics from backend (real scoring)
      if (deliveryRes.ok) {
        const deliveryData = await deliveryRes.json();
        setSpeechMetrics(prev => ({
          ...prev,
          wpm: deliveryData.wpm ?? prev.wpm,
          fillerCount: deliveryData.filler_count ?? prev.fillerCount,
          wordCount: deliveryData.word_count ?? prev.wordCount,
          duration: deliveryData.duration_seconds ?? prev.duration,
          // Extended delivery metrics
          pacingLabel: deliveryData.pacing_label,
          pacingScore: deliveryData.pacing_score,
          clarityScore: deliveryData.clarity_score,
          deliveryScore: deliveryData.delivery_score,
          deliveryTips: deliveryData.tips,
        }));
      }

      const data = await res.json();
      if (data.status === "interview_complete") {
        // Retrieve and persist report to MongoDB
        const reportRes = await fetch(`${apiBase}/interviews/sessions/${sessionId}/end-interview`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (reportRes.ok) {
          const reportData = await reportRes.json();
          setFinalReport(reportData.report);
        } else {
          alert(`Assessment Complete. Score: ${data.overall_score}/10`);
        }
        setInterviewActive(false);
        setFeedback(null);
        fetchPastSessions();
      } else {
        setFeedback(data.feedback?.overall_comment || data.feedback);
        setCurrentQuestion({ 
          question_text: data.next_question, 
          question_id: 0,
          difficulty: "medium"
        });
        setTranscript("");
      }
    } catch (err) {
      alert("Transmission Error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* 🔥 Kinetic Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-white/5">
          <div>
            <div className="text-accent font-black text-[10px] tracking-[0.5em] uppercase mb-5 flex items-center gap-3">
              <div className="flex gap-0.5 items-end h-3">
                {[...Array(4)].map((_, i) => (
                  <motion.div key={i} animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} className="w-1 bg-accent rounded-full" />
                ))}
              </div>
              Voice Interview Labs
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tighter text-text">
              Voice <span className="outline-text">Coach.</span>
            </h1>
          </div>
          {!interviewActive && !finalReport && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartInterview}
              className="px-8 py-3.5 bg-accent text-bg-surface rounded-xl flex items-center gap-3 text-[11px] font-black uppercase tracking-widest hover:filter hover:brightness-110 transition-all group shadow-lg"
            >
              Initialize Node 
              <div className="w-6 h-6 rounded-lg bg-bg-surface/20 flex items-center justify-center group-hover:bg-bg-surface group-hover:text-accent transition-colors">
                <Play size={10} fill="currentColor" />
              </div>
            </motion.button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {finalReport ? (
            /* 🔥 Diagnostic Report Panel */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key="report"
              className="max-w-3xl mx-auto glass-card p-12 bg-bg-surface border-border/80 shadow-2xl relative overflow-hidden"
            >
              <div className="text-accent font-black text-[10px] tracking-[0.5em] uppercase mb-4 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent" />
                Simulation Diagnostic Report
              </div>
              
              <div className="flex justify-between items-start gap-4 mb-10 pb-8 border-b border-white/5">
                <div>
                  <h2 className="text-4xl font-display font-black uppercase tracking-tighter text-text">
                    Evaluation <span className="outline-text">Complete.</span>
                  </h2>
                  <p className="text-xs font-bold text-text-muted mt-2">Target Role: {finalReport.role ? finalReport.role.replace(/_/g, ' ').toUpperCase() : "N/A"}</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-black tracking-tighter text-accent">{finalReport.overall_score}/10</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-text-muted mt-1">{finalReport.score_rating}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-accent">Strengths</h3>
                  <ul className="space-y-2">
                    {finalReport.strengths?.map((str: string, idx: number) => (
                      <li key={idx} className="text-xs font-bold text-text-muted flex items-start gap-2">
                        <span className="text-accent">✓</span> {str}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">Areas to Improve</h3>
                  <ul className="space-y-2">
                    {finalReport.improvements?.map((imp: string, idx: number) => (
                      <li key={idx} className="text-xs font-bold text-text-muted flex items-start gap-2">
                        <span className="text-amber-500">⚠</span> {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {finalReport.detailed_improvements && finalReport.detailed_improvements.length > 0 && (
                <div className="mb-10 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-text">Detailed Feedback</h3>
                  <div className="bg-[var(--bg-raised)] p-6 rounded-2xl border border-border space-y-3">
                    {finalReport.detailed_improvements.map((det: string, idx: number) => (
                      <p key={idx} className="text-xs font-bold text-text-muted leading-relaxed">
                        {det}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-8 border-t border-white/5">
                <div className="text-left">
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Recommendation</p>
                  <p className="text-sm font-black uppercase tracking-wide text-text mt-1">{finalReport.recommendation}</p>
                </div>
                <button
                  onClick={() => setFinalReport(null)}
                  className="px-8 py-3.5 bg-accent text-bg-surface rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                >
                  Dismiss Log :: return
                </button>
              </div>
            </motion.div>
          ) : !interviewActive ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              key="prep"
              className="grid grid-cols-1 lg:grid-cols-3 gap-10"
            >
              <div className="lg:col-span-2 glass-card p-12 overflow-hidden bg-bg-surface relative group border-border">
                {/* Waveform Visualization */}
                <div className="absolute -top-10 -right-10 opacity-[0.05] rotate-12 pointer-events-none group-hover:opacity-[0.1] transition-opacity text-accent">
                   <Volume2 size={300} strokeWidth={0.5} />
                </div>
                
                <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter mb-10 leading-none italic text-text">
                   Simulate the <br /> 
                   <motion.span 
                    animate={{ opacity: [1, 0.8, 1], x: [0, -1, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.2, repeatDelay: 3 }}
                    className="text-accent"
                   >
                     UNKNOWN.
                   </motion.span>
                </h2>

                <div className="space-y-8 mb-16 relative z-10">
                   {[
                     { t: "Confidence Scan", d: "Voice patterns analyze fluency and communication flow.", i: Mic },
                     { t: "Deep Feedback", d: "Real-time diagnostic on behavioral alignment.", i: Terminal },
                   ].map((item, i) => (
                     <div key={i} className="flex gap-8 items-start">
                       <div className="relative">
                         <div className="absolute -inset-2 bg-accent/10 rounded-full animate-pulse blur-md" />
                         <div className="w-12 h-12 rounded-xl bg-accent-soft border border-accent/20 flex items-center justify-center text-accent group-hover:rotate-3 transition-all relative z-10">
                           <item.i size={20} />
                         </div>
                       </div>
                       <div className="space-y-1.5">
                         <h4 className="font-black text-text uppercase text-xs tracking-widest">{item.t}</h4>
                         <p className="text-text-muted text-[13px] font-bold leading-relaxed">{item.d}</p>
                       </div>
                     </div>
                   ))}
                </div>

                <div className="space-y-3 mb-10 relative z-10 max-w-sm">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] block">
                    Choose Target Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-xl py-3 px-4 text-xs font-bold text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all"
                  >
                    <optgroup label="Engineering">
                      <option value="junior_dev">Junior Developer</option>
                      <option value="senior_dev">Senior Developer</option>
                      <option value="fullstack">Full Stack Engineer</option>
                      <option value="devops">DevOps Engineer</option>
                      <option value="data_scientist">Data Scientist</option>
                    </optgroup>
                    <optgroup label="Product & Management">
                      <option value="product_manager">Product Manager</option>
                    </optgroup>
                    <optgroup label="Business">
                      <option value="sales_executive">Sales Executive</option>
                      <option value="marketing_specialist">Marketing Specialist</option>
                      <option value="customer_support">Customer Support Specialist</option>
                    </optgroup>
                    <optgroup label="Other Roles">
                      <option value="hr_specialist">HR Specialist</option>
                      <option value="registered_nurse">Registered Nurse</option>
                      <option value="educator_teacher">Educator / Teacher</option>
                      <option value="accountant">Accountant</option>
                    </optgroup>
                  </select>
                </div>

                <motion.button
                  onClick={handleStartInterview}
                  disabled={loading}
                  whileHover="hover"
                  className="relative px-12 py-5 bg-accent text-bg-surface rounded-xl font-black text-xs uppercase tracking-[0.4em] hover:filter hover:brightness-110 transition-all overflow-hidden flex items-center justify-center shadow-xl"
                >
                  <motion.div 
                    variants={{ hover: { opacity: 1, x: 0 } }}
                    initial={{ opacity: 0, x: -20 }}
                    className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 pointer-events-none"
                  >
                    {[...Array(12)].map((_, i) => (
                      <motion.div key={i} animate={{ height: [4, 16, 4] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.05 }} className="w-1 bg-bg-surface/30" />
                    ))}
                  </motion.div>
                  <span className="relative z-10">{loading ? "Synching..." : "Launch Full Simulation"}</span>
                </motion.button>
              </div>

              {/* History Nodes */}
              <div className="space-y-6">
                <div className="glass-card p-8 bg-bg-surface border-border">
                  <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] mb-10">Recent Logs</h3>
                  <div className="space-y-4">
                    {pastSessions.length === 0 ? (
                      <div className="text-[10px] text-text-muted/40 font-black tracking-widest text-center py-10">
                        NO LOGS DETECTED
                      </div>
                    ) : (
                      pastSessions.slice(0, 5).map((log, i) => {
                        const score = log.overall_score || 0;
                        const displayScore = score <= 10 ? score * 10 : score;
                        return (
                          <motion.div 
                            key={log._id || i} 
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`flex items-center justify-between p-5 bg-[var(--bg-raised)] border-l-2 rounded-xl group hover:bg-[var(--bg-raised)]/80 transition-all border-[var(--border)]
                              ${displayScore > 80 ? 'border-l-[var(--accent)]' : displayScore > 60 ? 'border-l-[#C25A1A]' : 'border-l-red-500'}`}
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-black uppercase tracking-wider text-[var(--text)]">
                                {log.role ? log.role.replace(/_/g, ' ') : "Voice Simulation"}
                              </span>
                              <span className="text-[8px] font-bold text-[var(--text-muted)] tracking-widest">
                                {log.session_id ? `NODE_${log.session_id.slice(-6).toUpperCase()}` : "LOG_NODE"}
                              </span>
                            </div>
                            <div className={`font-black text-lg tracking-tighter ${displayScore > 80 ? 'text-[var(--accent)]' : displayScore > 60 ? 'text-[#C25A1A]' : 'text-red-500'}`}>
                              {displayScore}%
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* 🔥 Active High-Fidelity Interface */
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key="active"
              className="max-w-4xl mx-auto py-8"
            >
              <div className="flex items-center justify-between mb-12 px-4">
                <div className="flex items-center gap-4">
                   <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_var(--accent)] animate-pulse" />
                   <div className="text-[9px] font-black uppercase tracking-[0.4em] text-text-muted">Audio Connection Stable</div>
                </div>
                <div className="h-px flex-1 mx-10 bg-border" />
                <div className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Question #01</div>
              </div>

              <div className="glass-card bg-bg-raised p-16 md:p-24 text-center mb-12 border-accent/20 group overflow-hidden relative shadow-[0_0_80px_rgba(var(--accent-rgb),0.05)]">
                {/* Hero Audio Waveform (Animated Background) */}
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-[0.05] pointer-events-none">
                  {[...Array(60)].map((_, i) => (
                    <motion.div 
                      key={i} 
                      animate={{ height: isRecording ? [20, 120, 20] : [20, 50, 20] }} 
                      transition={{ repeat: Infinity, duration: isRecording ? 0.3 : 2, delay: i * 0.01 }} 
                      className="w-1 bg-accent rounded-full" 
                    />
                  ))}
                </div>

                {/* Tactical Overlays */}
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
                
                <div className="space-y-6 relative z-10">
                  <div className="text-accent font-black text-[9px] tracking-[0.4em] uppercase opacity-60">
                    Incoming Transmission // {currentQuestion?.difficulty || 'Standard'}
                  </div>
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={currentQuestion?.question_text}
                    className="text-2xl md:text-5xl font-display font-black text-text leading-[1.1] uppercase tracking-tighter"
                  >
                    {currentQuestion?.question_text || "Initializing Interview Node..."}
                  </motion.h2>
                </div>
              </div>

              {transcript && (
                <div className="my-10 p-6 bg-bg-surface/50 border border-border/80 rounded-2xl text-left max-w-xl mx-auto shadow-inner relative">
                  <div className="text-accent font-black text-[8px] tracking-[0.3em] uppercase opacity-60 mb-2">Live Transcript Scanner //</div>
                  <p className="text-xs font-bold text-text/80 leading-relaxed italic">&ldquo;{transcript}&rdquo;</p>
                </div>
              )}

              {feedback && (
                <motion.div 
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="mb-12 p-8 bg-accent-soft border-l-4 border-accent rounded-xl flex gap-6 items-start text-left"
                >
                   <Sparkles className="text-accent flex-shrink-0" size={24} />
                   <p className="text-[13px] font-bold text-text leading-relaxed tracking-tight">{feedback}</p>
                </motion.div>
              )}

              <div className="flex flex-col items-center gap-12">
                <div className="relative">
                  <AnimatePresence>
                    {isRecording && (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.4, opacity: 0.3 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute -inset-8 bg-accent rounded-full blur-2xl pointer-events-none" 
                      />
                    )}
                  </AnimatePresence>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                       if (isRecording) stopRecording();
                       else startRecording();
                    }}
                    disabled={loading}
                    className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-700 shadow-2xl relative z-10 border-2 ${
                      isRecording 
                        ? 'bg-accent text-bg-surface border-bg-surface/20 shadow-[0_0_80px_var(--accent)]' 
                        : 'bg-bg-surface text-accent border-accent/20 hover:border-accent/60'
                    }`}
                  >
                    {isRecording ? (
                      <Zap size={40} className="animate-pulse" />
                    ) : (
                      <Mic size={40} className="group-hover:scale-110 transition-transform" />
                    )}
                    <div className="absolute -bottom-1 text-[8px] font-black tracking-widest opacity-40">
                      {isRecording ? "LIVE" : "PUSH"}
                    </div>
                  </motion.button>
                </div>

                <div className="text-center space-y-5">
                  <p className="text-[9px] font-black uppercase tracking-[0.5em] text-text-muted">
                    {isRecording ? "Audio stream active" : "Standby for Signal"}
                  </p>
                  
                  {isRecording && (
                    <div className="flex gap-1.5 justify-center h-5 items-end">
                      {[...Array(16)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [4, 20, 4] }}
                          transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.03 }}
                          className="w-1 bg-accent rounded-full"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {!isRecording && (
                  <button 
                    disabled={loading}
                    onClick={async () => {
                      if (sessionId) {
                        setLoading(true);
                        try {
                          const res = await fetch(`${apiBase}/interviews/sessions/${sessionId}/end-interview`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setFinalReport(data.report);
                          }
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setLoading(false);
                          setInterviewActive(false);
                          setFeedback(null);
                          fetchPastSessions();
                        }
                      } else {
                        setInterviewActive(false);
                      }
                    }} 
                    className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted/20 hover:text-text-muted transition-colors pt-12 disabled:opacity-20"
                  >
                    Terminate Link :: Exit
                  </button>
                )}
              </div>

              {/* Real-time Oscilloscope Grid */}
              <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10">
                 {[
                   { 
                     m: 'Speech Pacing', 
                     val: speechMetrics.wpm, 
                     display: `${speechMetrics.wpm} WPM`, 
                     color: speechMetrics.wpm >= 110 && speechMetrics.wpm <= 160 ? 'var(--accent)' : '#C25A1A' 
                   },
                   { 
                     m: 'Filler Control', 
                     val: Math.max(0, 100 - speechMetrics.fillerCount * 20), 
                     display: `${speechMetrics.fillerCount} FILLERS`, 
                     color: speechMetrics.fillerCount <= 2 ? 'var(--accent)' : 'red' 
                   },
                   { 
                     m: 'Linguistic Depth', 
                     val: Math.min(100, Math.round((speechMetrics.wordCount / 60) * 100)), 
                     display: `${speechMetrics.wordCount} WORDS`, 
                     color: '#1A5C4B' 
                   }
                 ].map((metric) => (
                   <div key={metric.m} className="space-y-4 text-left">
                     <div className="flex justify-between items-end">
                       <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{metric.m}</span>
                       <span className="text-[10px] font-black uppercase italic" style={{ color: metric.color }}>{metric.display}</span>
                     </div>
                     <div className="h-0.5 w-full bg-border relative overflow-hidden">
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${Math.min(100, metric.val)}%` }}
                           transition={{ duration: 0.5 }}
                           className="absolute inset-y-0 bg-current"
                           style={{ color: metric.color }}
                        />
                     </div>
                   </div>
                 ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

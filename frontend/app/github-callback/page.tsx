"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { IconBrandGithub } from "@tabler/icons-react";
import { motion } from "framer-motion";

// ─── helpers ────────────────────────────────────────────────────────────────

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = RAW_API.endsWith("/api/v1") ? RAW_API : `${RAW_API}/api/v1`;

// ─── main component ──────────────────────────────────────────────────────────

function GitHubCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Authenticating session...");
  const [isLoginFlow, setIsLoginFlow] = useState(true);

  useEffect(() => {
    const code  = searchParams.get("code");
    const state = searchParams.get("state");
    const existingToken = typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

    const isLogin = state === "login" || !existingToken;
    setIsLoginFlow(isLogin);

    if (!code) {
      setStatus("error");
      setMessage("No authorization code received from GitHub. Please try again.");
      return;
    }

    const processCallback = async () => {
      try {
        if (isLogin) {
          // ── DIRECT LOGIN / SIGNUP FLOW ─────────────────────────────
          setMessage("Authenticating with GitHub...");

          const response = await fetch(`${API_BASE}/auth/github/direct-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code,
              redirect_uri: `${window.location.origin}/github-callback`,
            }),
          });

          let data: any = {};
          try {
            data = await response.json();
          } catch {
            // Non-JSON body
          }

          if (response.ok && data.access_token) {
            localStorage.setItem("token", data.access_token);
            if (data.refresh_token) {
              localStorage.setItem("refresh_token", data.refresh_token);
            }
            if (data.user) {
              localStorage.setItem("user", JSON.stringify(data.user));
            }

            setStatus("success");
            setMessage(
              `Welcome, ${data.user?.full_name || data.user?.github_username || "User"}! Redirecting…`
            );
            setTimeout(() => {
              if (data.user && !data.user.profession) {
                router.replace("/auth/onboarding");
              } else {
                router.replace("/dashboard");
              }
            }, 300);
          } else {
            const errMsg =
              data.detail ||
              (response.status === 500
                ? "Server error — GitHub credentials may not be configured on the backend."
                : response.status === 400
                ? "GitHub rejected the code (it may have expired — please try again)."
                : "GitHub authentication failed. Please try again.");
            setStatus("error");
            setMessage(errMsg);
          }
        } else {
          // ── PROFILE REPOSITORY LINKING FLOW ───────────────────────
          setMessage("Linking GitHub profile and syncing repository metadata…");

          const response = await fetch(`${API_BASE}/github/auth/callback?code=${code}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${existingToken}`,
              "Content-Type": "application/json",
            },
          });

          let data: any = {};
          try { data = await response.json(); } catch { /* ignore */ }

          if (response.ok && data.success) {
            setStatus("success");
            setMessage(
              `Successfully linked GitHub account: @${data.github_username}! Redirecting to profile…`
            );
            setTimeout(() => router.replace("/profile"), 1500);
          } else {
            setStatus("error");
            setMessage(data.detail || "Failed to link GitHub account to your profile.");
          }
        }
      } catch (err) {
        console.error("GitHub callback exchange failed", err);
        setStatus("error");
        setMessage(
          "Could not reach the server. It may still be starting up — please wait 30 s and try signing in again."
        );
      }
    };

    processCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center font-sans px-6 text-text overflow-hidden relative transition-colors duration-200">
      {/* Background radial glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, var(--accent-soft) 0%, transparent 70%)",
          opacity: 0.15,
        }}
      />

      {/* Dotted texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.15] bg-[radial-gradient(var(--border)_1.5px,transparent_1.5px)] [background-size:24px_24px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-bg-surface border border-border p-10 max-w-md w-full text-center space-y-6 relative z-10 rounded-[2rem] shadow-sm"
      >
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 bg-bg-raised border border-border rounded-3xl flex items-center justify-center text-text relative shadow-sm">
              <IconBrandGithub
                size={40}
                className={status === "loading" ? "animate-pulse text-accent" : "text-text"}
              />
            </div>

            {status === "loading" && (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-bg border border-border rounded-xl flex items-center justify-center text-accent shadow-sm">
                <Loader2 className="animate-spin" size={16} />
              </div>
            )}
            {status === "success" && (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-bg border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                <CheckCircle2 size={18} />
              </div>
            )}
            {status === "error" && (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-bg border border-red-500/30 rounded-xl flex items-center justify-center text-red-500 shadow-sm">
                <AlertTriangle size={18} />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
            {status === "loading"
              ? isLoginFlow
                ? "AUTHENTICATING SESSION"
                : "LINKING REPOSITORY"
              : status === "success"
              ? "VERIFICATION COMPLETE"
              : "AUTHENTICATION ERROR"}
          </h2>
          <p className="text-sm font-semibold leading-relaxed text-text">{message}</p>
        </div>

        {/* Animated loading bar */}
        {status === "loading" && (
          <div className="w-full h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, var(--accent), var(--accent-soft))",
                animation: "ghprogress 2.5s ease-in-out infinite",
                width: "40%",
              }}
            />
          </div>
        )}

        {status === "error" && (
          <div className="pt-2 space-y-3">
            <button
              onClick={() => router.push(isLoginFlow ? "/auth/login" : "/profile")}
              className="w-full py-3.5 bg-accent hover:bg-accent-hover text-bg-surface rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm"
            >
              {isLoginFlow ? "Return to Sign In" : "Return to Profile"}
            </button>
            <p className="text-[10px] text-text-muted font-medium">
              If the error persists, the server may need ~30 s to wake up. Try again after a short wait.
            </p>
          </div>
        )}
      </motion.div>

      <style jsx global>{`
        @keyframes ghprogress {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(150%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}

export default function GitHubCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg flex flex-col items-center justify-center font-sans px-6 text-text">
          <div className="bg-bg-surface border border-border p-10 max-w-md w-full text-center space-y-6 rounded-[2rem]">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-bg-raised border border-border rounded-3xl flex items-center justify-center text-accent">
                <Loader2 className="animate-spin" size={32} />
              </div>
            </div>
            <p className="text-sm font-semibold text-text-muted">
              Initializing GitHub authentication…
            </p>
          </div>
        </div>
      }
    >
      <GitHubCallbackContent />
    </Suspense>
  );
}

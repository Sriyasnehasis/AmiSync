"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SiteLogo } from "@/components/SiteLogo";

type Status = "loading" | "success" | "error";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const { setToken, setUser } = useAuth();
  const [message, setMessage] = useState("Verifying your identity...");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const run = async () => {
      const token = new URLSearchParams(window.location.search).get(
        "access_token",
      );
      if (!token) {
        setStatus("error");
        setMessage("OAuth sign-in failed. No token received.");
        setTimeout(() => router.replace("/auth/login"), 3000);
        return;
      }

      try {
        setToken(token);
        setMessage("Fetching your profile...");

        const rawApiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const apiBase = rawApiUrl.endsWith("/api/v1")
          ? rawApiUrl
          : `${rawApiUrl}/api/v1`;

        const meResponse = await fetch(`${apiBase}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (meResponse.ok) {
          const me = await meResponse.json();
          setUser(me);
          setStatus("success");
          setMessage("Welcome back! Redirecting...");
          setTimeout(() => {
            if (!me.profession) {
              router.replace("/auth/onboarding");
            } else {
              router.replace("/dashboard");
            }
          }, 800);
        } else {
          setStatus("success");
          setMessage("Signed in! Redirecting to dashboard...");
          setTimeout(() => router.replace("/dashboard"), 800);
        }
      } catch {
        setStatus("error");
        setMessage("Unable to complete sign-in. Please try again.");
        setTimeout(() => router.replace("/auth/login"), 3000);
      }
    };

    run();
  }, [router, setToken, setUser]);

  return (
    <div className="min-h-screen bg-bg font-sans flex flex-col items-center justify-center relative overflow-hidden selection:bg-accent-soft text-text">
      {/* Animated radial gradient backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, var(--accent-soft) 0%, transparent 70%)",
          opacity: 0.12,
        }}
      />

      {/* Subtle mesh pattern */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, var(--text) 0px, var(--text) 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, var(--text) 0px, var(--text) 1px, transparent 1px, transparent 60px)",
        }}
      />

      {/* Floating orb top-left */}
      <div
        aria-hidden
        className="absolute top-[-120px] left-[-120px] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          opacity: 0.06,
        }}
      />
      {/* Floating orb bottom-right */}
      <div
        aria-hidden
        className="absolute bottom-[-150px] right-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, var(--accent-2) 0%, transparent 70%)",
          opacity: 0.07,
        }}
      />

      {/* Logo badge top */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
        <SiteLogo className="w-12 h-12" />
        <span className="text-[9px] font-black tracking-[0.5em] text-text-muted/40 uppercase">
          AmiSync
        </span>
      </div>

      {/* Main card */}
      <div
        className="relative z-10 w-full max-w-sm mx-4 rounded-[2rem] border border-border bg-bg-surface shadow-2xl overflow-hidden"
        style={{ backdropFilter: "blur(24px)" }}
      >
        {/* Accent top bar */}
        <div
          className="h-1 w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--accent) 0%, var(--accent-soft) 60%, transparent 100%)",
          }}
        />

        <div className="px-10 py-12 flex flex-col items-center gap-6">
          {/* Spinner / icon */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Outer spinning ring */}
            {status === "loading" && (
              <svg
                className="absolute inset-0 w-full h-full animate-spin"
                viewBox="0 0 80 80"
                fill="none"
              >
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="var(--border)"
                  strokeWidth="4"
                />
                <path
                  d="M40 6 A34 34 0 0 1 74 40"
                  stroke="var(--accent)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            )}

            {/* Inner icon container */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center border border-border"
              style={{ background: "var(--bg-surface-alt)" }}
            >
              {status === "loading" && (
                /* Google G icon */
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}

              {status === "success" && (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}

              {status === "error" && (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
            </div>
          </div>

          {/* Text content */}
          <div className="text-center space-y-1.5">
            <h1 className="text-[11px] font-black uppercase tracking-[0.4em] text-text-muted">
              {status === "loading" && "Google OAuth"}
              {status === "success" && "Signed In"}
              {status === "error" && "Sign-In Failed"}
            </h1>
            <p className="text-sm font-semibold text-text leading-relaxed">
              {message}
            </p>
          </div>

          {/* Loading dots */}
          {status === "loading" && (
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "var(--accent)",
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Progress bar */}
          {status === "loading" && (
            <div className="w-full h-0.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, var(--accent), var(--accent-soft))",
                  animation: "progress 2s ease-in-out infinite",
                  width: "60%",
                }}
              />
            </div>
          )}

          {status === "error" && (
            <button
              onClick={() => router.replace("/auth/login")}
              className="mt-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-bg-surface transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "var(--accent)" }}
            >
              Back to Login
            </button>
          )}
        </div>
      </div>

      {/* Bottom label */}
      <p className="mt-8 text-[10px] font-bold text-text-muted/40 tracking-widest uppercase z-10">
        Secured via Google OAuth 2.0
      </p>

      <style jsx global>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(60%); }
          100% { transform: translateX(200%); }
        }
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

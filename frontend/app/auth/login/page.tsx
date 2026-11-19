"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  IconMail,
  IconLock,
  IconArrowRight,
  IconBrandGoogle,
  IconBrandGithub,
} from "@tabler/icons-react";
import { SiteLogo } from "@/components/SiteLogo";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const rawApiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const apiBase = rawApiUrl.endsWith("/api/v1")
      ? rawApiUrl
      : `${rawApiUrl}/api/v1`;

    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.access_token);

        const userRes = await fetch(`${apiBase}/users/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          localStorage.setItem("user", JSON.stringify(userData));
          if (!userData.profession) {
            router.push("/auth/onboarding");
          } else {
            router.push("/dashboard");
          }
        } else {
          router.push("/dashboard");
        }
      } else {
        const errData = await res.json();
        // Parse validation errors from Pydantic
        let errMsg = "Login failed";
        if (typeof errData.detail === "string") {
          errMsg = errData.detail;
        } else if (Array.isArray(errData.detail)) {
          errMsg = errData.detail.map((err: any) => err.msg).join("\n");
        }
        alert(errMsg);
      }
    } catch (err) {
      console.error(err);
      alert("Connectivity failure. Verify local backend status.");
    } finally {
      setLoading(false);
    }
  };

  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const apiBase = rawApiUrl.endsWith("/api/v1")
    ? rawApiUrl
    : `${rawApiUrl}/api/v1`;

  /**
   * GitHub OAuth: Build the GitHub authorization URL directly in the browser.
   * This avoids hitting the Render backend (which may be sleeping) before
   * GitHub's consent screen — the backend is only contacted AFTER GitHub
   * redirects back with the code.
   *
   * Google OAuth: Still needs the backend redirect (server-side secret), so
   * we ping the health endpoint first to wake the Render dyno.
   */
  const handleOAuthLogin = useCallback(async (provider: "google" | "github") => {
    setOauthLoading(provider);

    if (provider === "github") {
      // Build GitHub OAuth URL client-side — no Render cold-start delay
      const githubClientId =
        process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "";
      const callbackUrl = `${window.location.origin}/github-callback`;
      const params = new URLSearchParams({
        client_id: githubClientId,
        redirect_uri: callbackUrl,
        scope: "read:user user:email repo",
        state: "login",
        allow_signup: "true",
      });
      window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
      return;
    }

    // Google: redirect to backend OAuth endpoint
    const googleUrl = `${apiBase}/auth/google/login`;
    window.location.href = googleUrl;
  }, [apiBase]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden px-4 font-sans text-text transition-colors duration-200">
      {/* 🧭 Top Bar containing logo and theme switcher */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20 max-w-6xl mx-auto">
        <Link href="/" className="group flex items-center gap-3">
          <SiteLogo className="w-12 h-12" />
          <img
            src="/amisync-name-light.svg?v=2"
            alt="AmiSync"
            className="h-7 w-auto block dark:hidden"
            draggable={false}
          />
          <img
            src="/amisync-name-dark.svg?v=2"
            alt="AmiSync"
            className="h-7 w-auto hidden dark:block"
            draggable={false}
          />
        </Link>
        <ThemeSwitcher />
      </div>

      {/* Dotted background texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.15] bg-[radial-gradient(var(--border)_1.5px,transparent_1.5px)] [background-size:24px_24px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[380px] bg-bg-surface border border-border p-8 md:p-10 rounded-[2rem] relative z-10 shadow-sm mt-12"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold uppercase tracking-tight text-text mb-1 font-display">
            Sign In
          </h1>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
            Welcome Back to AmiSync
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <IconMail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors"
              size={16}
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full bg-bg-raised border border-border text-text placeholder:text-text-muted focus:border-accent/50 focus:outline-none transition-all rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative group">
            <IconLock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors"
              size={16}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-bg-raised border border-border text-text placeholder:text-text-muted focus:border-accent/50 focus:outline-none transition-all rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-hover text-bg-surface py-3.5 rounded-xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all mt-6"
          >
            {loading ? "Signing In..." : "Sign In"}
            {!loading && <IconArrowRight size={16} />}
          </button>
        </form>

        {/* 🔗 Social Login Divider & Buttons */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-x-0 h-px bg-border" />
          <span className="relative text-[9px] uppercase font-bold text-text-muted bg-bg-surface px-3 z-10">
            Or continue with
          </span>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleOAuthLogin("google")}
            disabled={oauthLoading !== null}
            className="flex-1 flex items-center justify-center gap-2 border border-border hover:bg-bg-raised text-text hover:border-accent/40 rounded-xl py-3.5 text-xs font-bold transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait disabled:scale-100"
          >
            {oauthLoading === "google" ? (
              <>
                <svg className="animate-spin" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                </svg>
                <span>Waking up server…</span>
              </>
            ) : (
              <>
                <IconBrandGoogle size={16} className="text-accent" />
                <span>Google</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleOAuthLogin("github")}
            disabled={oauthLoading !== null}
            className="flex-1 flex items-center justify-center gap-2 border border-border hover:bg-bg-raised text-text hover:border-accent/40 rounded-xl py-3.5 text-xs font-bold transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait disabled:scale-100"
          >
            {oauthLoading === "github" ? (
              <>
                <svg className="animate-spin" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                </svg>
                <span>Waking up server…</span>
              </>
            ) : (
              <>
                <IconBrandGithub size={16} className="text-text-muted" />
                <span>GitHub</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[11px] font-bold text-text-muted">
            New here?{" "}
            <Link
              href="/auth/signup"
              className="text-accent hover:underline font-bold transition-all"
            >
              Create your free account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

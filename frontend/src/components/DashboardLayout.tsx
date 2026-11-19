"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  TrendingUp,
  Briefcase,
  Mic,
  Users,
  LogOut,
  Menu,
  X,
  User,
  Settings,
  Zap,
  Command as CommandIcon,
  Bell,
  Loader2,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { CommandBar } from "@/components/CommandBar";
import { FloatingActionRing } from "@/components/FloatingActionRing";
import { SiteLogo } from "@/components/SiteLogo";

const navSections = [
  {
    title: "Core Ecosystem",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      {
        href: "/resume",
        label: "Resume Builder",
        icon: FileText,
        badge: "NEW",
      },
      { href: "/interviews", label: "Mock Interview", icon: Mic },
      { href: "/cover-letter", label: "Cover Letter", icon: Zap },
      { href: "/tracker", label: "Tracker", icon: TrendingUp }
    ],
  },
  {
    title: "Optimization",
    items: [
      { href: "/skill-gap", label: "Skill Gap", icon: Sparkles },
    ],
  },
];

export default function DashboardLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState("Professional");
  const [isMac, setIsMac] = useState(false);
  const [careerHealth, setCareerHealth] = useState<number | null>(null);

  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const apiBase = rawApiUrl.endsWith("/api/v1") ? rawApiUrl : `${rawApiUrl}/api/v1`;

  const [apiWakingUp, setApiWakingUp] = useState(false);

  useEffect(() => {
    setIsMac(navigator.userAgent.indexOf("Mac") !== -1);
    const token = localStorage.getItem("token");
    const raw = localStorage.getItem("user");
    if (!token || !raw) {
      router.push("/auth/login");
      return;
    }
    const parsed = JSON.parse(raw);
    const name = parsed?.full_name?.split(" ")[0] || "Professional";
    setUserName(name);
    document.title = title
      ? `AmiSync | ${title}`
      : `AmiSync | Welcome, ${name}`;

    // Verify token validity and compute real career health score
    fetch(`${apiBase}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(async res => {
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/auth/login");
        return;
      }
      if (res.ok) {
        const me = await res.json();
        // Calculate profile completeness score
        const checks = [
          !!me.full_name,           // 12 pts
          !!me.email,               // 12 pts
          !!me.profession,          // 15 pts
          !!me.bio,                 // 10 pts
          !!me.linkedin_url,        // 8 pts
          !!me.phone,               // 8 pts
        ];
        const weights = [12, 12, 15, 10, 8, 8];
        let score = checks.reduce((acc, ok, i) => acc + (ok ? weights[i] : 0), 0);

        // Fetch profile-data for extra checks (resume, skills, roles, experience)
        try {
          const pdRes = await fetch(`${apiBase}/users/me/profile-data`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (pdRes.ok) {
            const pd = await pdRes.json();
            if (pd.years_of_experience > 0) score += 8;    // 8 pts
            if (pd.preferred_roles?.length > 0) score += 9;  // 9 pts
            if (pd.primary_skills?.length > 0) score += 9;   // 9 pts
          }
        } catch (_) { /* ignore */ }

        // Fetch resumes for extra resume-upload bonus
        try {
          const rvRes = await fetch(`${apiBase}/resume/list`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (rvRes.ok) {
            const rv = await rvRes.json();
            const hasResume = Array.isArray(rv) ? rv.length > 0 : (rv?.resumes?.length > 0);
            if (hasResume) score += 9; // 9 pts for having a resume
          }
        } catch (_) { /* ignore */ }

        setCareerHealth(Math.min(score, 100));
      }
    }).catch(err => {
      console.log("Token validation check failed:", err);
    });

    // Cold-start wakeup logic
    let isMounted = true;
    const wakeTimer = setTimeout(() => {
      if (isMounted) setApiWakingUp(true);
    }, 2000);

    fetch(`${apiBase}/health`)
      .then(() => {
        clearTimeout(wakeTimer);
        if (isMounted) setApiWakingUp(false);
      })
      .catch((err) => {
        console.log("Health check failed:", err);
      });

    // Keep-alive pinger: hits the backend health endpoint every 14 minutes (840,000 ms)
    const pingInterval = setInterval(() => {
      fetch(`${apiBase}/health`).catch((err) => console.log("Keep-alive ping failed:", err));
    }, 840000);

    return () => {
      isMounted = false;
      clearTimeout(wakeTimer);
      clearInterval(pingInterval);
    };
  }, [title, router, apiBase]);

  const isActive = (href: string) => pathname === href;

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-bg border-r border-border">
      <div className="p-8 pb-12">
        <Link href="/" className="flex items-center gap-2.5 group">
          <SiteLogo className="w-12 h-12" />
          <img
            src="/amisync-name-light.svg?v=3"
            alt="AmiSync"
            className="h-7 w-auto block dark:hidden"
            draggable={false}
          />
          <img
            src="/amisync-name-dark.svg?v=3"
            alt="AmiSync"
            className="h-7 w-auto hidden dark:block"
            draggable={false}
          />
        </Link>
      </div>

      <nav className="flex-1 px-6 space-y-8 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-3">
            <p className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted/60">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                      ${
                        active
                          ? "bg-accent-soft text-accent font-bold"
                          : "text-text-muted hover:bg-bg-raised hover:text-text"
                      }`}
                  >
                    <item.icon
                      size={18}
                      className={
                        active
                          ? "text-accent"
                          : "text-text-muted group-hover:text-text"
                      }
                    />
                    <span className="text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-[8px] font-black bg-accent text-bg px-1.5 py-0.5 rounded uppercase tracking-tighter">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Career Progress Mini Widget */}
      <div className="p-6 mt-auto">
        <div className="p-4 bg-bg-raised rounded-2xl border border-border">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">
              Career Health
            </span>
            {careerHealth !== null ? (
              <span className={`text-[10px] font-bold ${
                careerHealth >= 75 ? "text-accent" : careerHealth >= 50 ? "text-yellow-500" : "text-red-400"
              }`}>{careerHealth}%</span>
            ) : (
              <span className="text-[9px] text-text-muted animate-pulse">Loading...</span>
            )}
          </div>
          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: careerHealth !== null ? `${careerHealth}%` : "0%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${
                careerHealth !== null && careerHealth < 50 ? "bg-red-400" :
                careerHealth !== null && careerHealth < 75 ? "bg-yellow-500" : "bg-accent"
              }`}
            />
          </div>
          {careerHealth !== null && careerHealth < 75 && (
            <p className="text-[8px] text-text-muted mt-1.5">Complete your profile to improve score</p>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-border">
        <button
          onClick={() => {
            localStorage.clear();
            router.push("/auth/login");
          }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-50 transition-all text-xs font-bold"
        >
          <LogOut size={16} />
          <span>LOGOUT</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-bg text-text font-body">
      <CommandBar />
      <FloatingActionRing />

      <div className="hidden lg:block w-72 h-full shrink-0">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-20 flex items-center justify-between px-8 bg-bg-surface border-b border-border z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 hover:bg-bg-raised rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-bg-raised border border-border rounded-full text-[10px] font-bold text-text-muted">
              <CommandIcon size={12} />
              <span>
                Press <kbd className="text-text font-mono">⌘K</kbd> to search
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <ThemeSwitcher />
            <button className="p-2 text-text-muted hover:text-text transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-bg-surface" />
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-border ml-2">
              <div className="text-right hidden sm:flex flex-col justify-center">
                <p className="text-[9px] font-black uppercase tracking-tighter text-text-muted leading-none mb-1">
                  Node_Verified
                </p>
                <p className="text-sm font-black leading-none">{userName}</p>
              </div>
              <Link
                href="/profile"
                className="w-10 h-10 rounded-full bg-accent text-bg-surface flex items-center justify-center font-black transition-transform hover:scale-110 shadow-sm"
              >
                {userName.charAt(0).toUpperCase()}
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          {apiWakingUp && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto mb-6 p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-amber-500 text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-pulse"
            >
              <Loader2 className="animate-spin" size={14} />
              <span>Waking up server, just a moment...</span>
            </motion.div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-6xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] lg:hidden bg-bg/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-72 h-full bg-bg shadow-2xl relative"
            >
              <Sidebar />
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-8 -right-12 p-2 text-bg bg-text rounded-full"
              >
                <X size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, LogOut } from "lucide-react";
import { SiteLogo } from "./SiteLogo";
import { Button } from "./UI";

// ─── Descriptive navigation labels visible to all visitors ──────────────────
const NAV_LINKS = [
  { label: "Resume Optimizer", href: "/resume" },
  { label: "Interview Prep", href: "/interviews" },
];

interface HeaderProps {
  userName?: string;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userName, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-surface-200 shadow-sm sticky top-0 z-40">
      <nav className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 md:px-6">
        {/* Logo — always left */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <SiteLogo className="w-10 h-10" />
          <img
            src="/amisync-name-light.svg?v=2"
            alt="AmiSync"
            className="h-6 w-auto hidden md:inline dark:md:hidden"
            draggable={false}
          />
          <img
            src="/amisync-name-dark.svg?v=2"
            alt="AmiSync"
            className="h-6 w-auto hidden dark:md:inline"
            draggable={false}
          />
        </Link>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-surface-600 hover:text-surface-900 transition-colors p-1"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop Navigation — centered */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-[11px] font-bold uppercase tracking-widest text-surface-600 hover:text-brand-600 transition-colors duration-200 group whitespace-nowrap"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-brand-600 transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          {userName ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center">
                <span className="font-semibold text-brand-700 text-sm">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-surface-700">
                {userName}
              </span>
              <button
                onClick={onLogout}
                className="text-surface-500 hover:text-surface-900 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          )}
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-surface-200">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-3 py-2.5 rounded-lg text-surface-700 hover:bg-brand-50 hover:text-brand-700 font-semibold text-sm transition-all"
              >
                {link.label}
              </Link>
            ))}
            {!userName && (
              <div className="pt-2 border-t border-surface-100 mt-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

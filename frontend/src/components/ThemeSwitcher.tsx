"use client";

import { useTheme } from "./ThemeProvider";
import { motion } from "framer-motion";

export function ThemeSwitcher() {
  const { theme: currentTheme, setTheme } = useTheme();

  const themes = [
    { id: "light", color: "#5845FE", label: "Light Mode" },
    { id: "dark", color: "#6C5CE7", label: "Dark Mode" },
  ] as const;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-bg-raised border border-border">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          title={t.label}
          className="relative w-4 h-4 group"
        >
          <div
            className="w-full h-full rounded-full transition-transform duration-200 group-hover:scale-110"
            style={{ backgroundColor: t.color }}
          />
          {currentTheme === t.id && (
            <motion.div
              layoutId="theme-ring"
              className="absolute -inset-1 border border-text/20 rounded-full"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

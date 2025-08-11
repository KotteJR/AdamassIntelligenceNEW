"use client";

import React, { createContext, useContext } from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = React.useState<boolean>(false);

  React.useEffect(() => {
    const stored = localStorage.getItem("theme");
    const initialDark = stored === "dark";
    setIsDark(initialDark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div className={isDark ? "dark-theme" : "light-theme"}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`h-9 w-9 inline-flex items-center justify-center rounded-full border shadow-sm transition-colors ${
        isDark 
          ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" 
          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
      }`}
      aria-label="Toggle theme"
      title={isDark ? "Switch to light" : "Switch to dark"}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}


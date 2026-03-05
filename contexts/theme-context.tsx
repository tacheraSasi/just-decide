import React, { createContext, useCallback, useContext, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  resolved: "light",
  isDark: false,
  setMode: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [mode, setMode] = useState<ThemeMode>("system");

  const resolved: ResolvedTheme =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  const isDark = resolved === "dark";

  const toggle = useCallback(() => {
    setMode((prev) => {
      if (prev === "system") {
        // If system is dark, toggle to light; otherwise toggle to dark
        return systemScheme === "dark" ? "light" : "dark";
      }
      return prev === "dark" ? "light" : "dark";
    });
  }, [systemScheme]);

  return (
    <ThemeContext.Provider value={{ mode, resolved, isDark, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

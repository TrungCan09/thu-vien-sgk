import { Theme } from "@radix-ui/themes";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type ThemePreference = "system" | "light" | "dark";

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: "light" | "dark";
  setPreference: (value: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem("sgk-theme");
    return saved === "light" || saved === "dark" ? saved : "system";
  });
  const [system, setSystem] = useState<"light" | "dark">(systemTheme);
  const resolved = preference === "system" ? system : preference;

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystem(media.matches ? "dark" : "light");
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  }, [resolved]);

  const value = useMemo<ThemeContextValue>(() => ({
    preference,
    resolved,
    setPreference(value) {
      setPreferenceState(value);
      if (value === "system") localStorage.removeItem("sgk-theme");
      else localStorage.setItem("sgk-theme", value);
    },
  }), [preference, resolved]);

  return (
    <ThemeContext.Provider value={value}>
      <Theme appearance={resolved} accentColor="blue" grayColor="slate" radius="large" panelBackground="solid">
        {children}
      </Theme>
    </ThemeContext.Provider>
  );
}

export function useThemePreference() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useThemePreference must be used inside ThemeProvider");
  return value;
}

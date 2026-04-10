"use client";

import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { App as AntApp, ConfigProvider, theme as antdTheme } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";

type ThemeMode = "light" | "dark";

const ThemeContext = createContext<{
  mode: ThemeMode;
  toggleTheme: () => void;
}>({
  mode: "light",
  toggleTheme: () => undefined
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

export function AppProviders({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem("resume-theme") as ThemeMode | null;
    if (stored === "light" || stored === "dark") {
      setMode(stored);
    }
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    window.localStorage.setItem("resume-theme", mode);

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        setMode((current) => (current === "light" ? "dark" : "light"));
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("candidate-search")?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, mounted]);

  const themeConfig = useMemo(
    () => ({
      algorithm: mode === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: "#bf5b31",
        colorInfo: "#bf5b31",
        colorSuccess: "#2f9e78",
        colorWarning: "#e4a11b",
        colorError: "#d9485f",
        borderRadius: 18,
        fontFamily: '"Avenir Next", "Segoe UI Variable Text", "PingFang SC", "Hiragino Sans GB", sans-serif'
      }
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider
      value={{
        mode,
        toggleTheme: () => setMode((current) => (current === "light" ? "dark" : "light"))
      }}
    >
      <AntdRegistry>
        <ConfigProvider theme={themeConfig}>
          <AntApp>
            <div className={`theme-root ${mode === "dark" ? "theme-dark" : "theme-light"}`}>{children}</div>
          </AntApp>
        </ConfigProvider>
      </AntdRegistry>
    </ThemeContext.Provider>
  );
}

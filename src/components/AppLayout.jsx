import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { IOSFrame } from "../ios-frame";
import { AppContextProvider } from "../contexts/AppContext";

const tabs = [
  { to: "/home", label: "홈", icon: "home" },
  { to: "/exercise", label: "운동", icon: "exercise" },
  { to: "/diagnosis", label: "진단", icon: "diagnosis" },
  { to: "/records", label: "기록", icon: "records" },
  { to: "/mypage", label: "마이", icon: "my" },
];

function TabIcon({ kind }) {
  if (kind === "home") return <svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 11.5L12 5l8 6.5V20h-5.2v-5.2H9.2V20H4z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>;
  if (kind === "exercise") return <svg viewBox="0 0 24 24" width="18" height="18"><rect x="4" y="5" width="16" height="15" rx="3" fill="none" stroke="currentColor" strokeWidth="1.7"/><path d="M8 3v4M16 3v4M8 11h8M8 15h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
  if (kind === "diagnosis") return <svg viewBox="0 0 24 24" width="18" height="18"><path d="M3 13h4l2-4 3 8 2.5-5H21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (kind === "records") return <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 19V5m6 14V9m6 10v-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M4 19h16" stroke="currentColor" strokeWidth="1.6"/></svg>;
  return <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.7"/><path d="M4 20c0-3.7 3.3-6 8-6s8 2.3 8 6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>;
}

export default function AppLayout() {
  const { pathname } = useLocation();
  const shellRef = React.useRef(null);
  const hideNav = pathname === "/" || pathname === "/login";
  const showThemeToggle = pathname === "/home";
  const [diagnosis, setDiagnosis] = React.useState({
    selectedPart: "waist",
    partLabel: "허리",
    painLevel: 2,
    updatedAt: null,
  });

  const [theme, setTheme] = React.useState(() => {
    try {
      return localStorage.getItem("pat_theme") || "light";
    } catch {
      return "light";
    }
  });
  const isDark = theme === "dark";

  React.useEffect(() => {
    try {
      localStorage.setItem("pat_theme", theme);
    } catch {}
  }, [theme]);

  React.useEffect(() => {
    if (shellRef.current) {
      shellRef.current.scrollTop = 0;
    }
  }, [pathname]);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));
  const isActiveTab = (to) => pathname === to || pathname.startsWith(`${to}/`);
  const appShellClass = pathname === "/home" ? "app-shell-react no-scroll" : "app-shell-react";
  const appContextValue = { theme, isDark, diagnosis, setDiagnosis };

  return (
    <div className={`app-bg-wrap theme-${theme}`}>
      <div className="app-bg" />
      <div className="phone-stage">
        <IOSFrame dark={isDark}>
          {showThemeToggle && (
            <button className="theme-toggle" onClick={toggleTheme} aria-label="테마 전환">
              <span className={`theme-knob ${isDark ? "dark" : ""}`}>{isDark ? "☾" : "☼"}</span>
            </button>
          )}

          <main ref={shellRef} className={appShellClass}>
            <AppContextProvider value={appContextValue}>
              <Outlet />
            </AppContextProvider>
          </main>

          {!hideNav && (
            <nav className={`bottom-nav-react ${isDark ? "bottom-nav-dark" : ""}`}>
              {tabs.map((tab) => (
                <Link key={tab.to} to={tab.to} className={isActiveTab(tab.to) ? "active" : ""}>
                  <TabIcon kind={tab.icon} />
                  <span>{tab.label}</span>
                </Link>
              ))}
            </nav>
          )}
        </IOSFrame>
      </div>
    </div>
  );
}




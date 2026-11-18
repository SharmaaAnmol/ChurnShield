import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Moon, Shield, Sun } from "lucide-react";

const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/data", label: "The data" },
  { to: "/prediction-studio", label: "Try the model" },
  { to: "/model", label: "Results" },
  { to: "/customers", label: "Customers" },
  { to: "/how-its-built", label: "How it's built" },
];

type Theme = "light" | "dark";
const STORAGE_KEY = "cs-theme"; // also read by the pre-paint script in index.html

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Follow the OS setting until the viewer picks a theme themselves.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(STORAGE_KEY);
      } catch {}
      if (!saved) setTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => {
        setTheme(next);
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {}
      }}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[1.5px] border-ink text-ink press hover:bg-wash"
    >
      {theme === "dark" ? (
        <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
      ) : (
        <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
      )}
    </button>
  );
}

export function SiteShell() {
  // A new page starts at the top, otherwise "Next" links land at the bottom of the next page.
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const page = NAV.find((n) => n.to === pathname && n.to !== "/");
    document.title = page
      ? `${page.label} · ChurnShield`
      : "ChurnShield — Who won't come back?";
  }, [pathname]);

  return (
    <div className="min-h-screen bg-paper text-ink font-ui selection:bg-route-wash">
      <header className="border-b-[1.5px] border-ink">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-6 lg:px-10">
          <NavLink
            to="/"
            className="order-1 flex items-center gap-3"
            aria-label="ChurnShield home"
          >
            <span className="grid h-9 w-9 place-items-center rounded-[6px] border-[1.5px] border-ink">
              <Shield
                className="h-5 w-5"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </span>
            <span className="font-display text-[32px] font-semibold leading-none tracking-[-0.005em]">
              Churn<em className="font-semibold text-route">Shield</em>
            </span>
          </NavLink>

          {/* phones: logo + toggle on row 1, nav scrolls on row 2; wider: logo, nav, toggle */}
          <nav
            aria-label="Main"
            className="order-3 -mx-4 w-[calc(100%+2rem)] overflow-x-auto sm:order-2 sm:ml-auto px-4 [scrollbar-width:none] sm:mx-0 sm:w-auto sm:px-0"
          >
            <ul className="flex gap-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `press block whitespace-nowrap rounded-[6px] px-4 py-2 text-[15px] font-semibold ${
                        isActive
                          ? "bg-ink text-sheet"
                          : "text-ink hover:bg-wash"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="order-2 sm:order-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="mt-24 border-t-[1.5px] border-ink">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-8 text-[14px] text-ink-2 sm:px-6 lg:px-10 md:flex-row md:justify-between">
          <p>
            Every number on this site is computed from files in the project's
            GitHub repository:{" "}
            <code className="font-mono text-[13px] text-ink">artifacts/</code> →{" "}
            <code className="font-mono text-[13px] text-ink">
              export_webapp_data.py
            </code>{" "}
            →{" "}
            <code className="font-mono text-[13px] text-ink">
              webapp/public/data/
            </code>
            .
          </p>
          <p>
            Data: Olist Brazilian E-Commerce Public Dataset (CC BY-NC-SA 4.0) ·{" "}
            <a
              href="https://github.com/SharmaaAnmol/ChurnShield"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-route"
            >
              GitHub
            </a>{" "}
            ·{" "}
            <NavLink to="/how-its-built" className="font-semibold text-route">
              How it's built
            </NavLink>
          </p>
        </div>
      </footer>
    </div>
  );
}

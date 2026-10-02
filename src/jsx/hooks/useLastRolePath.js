import { useCallback, useState } from "react";
import { SITE_ROLES } from "./useSiteRole";

const STORAGE_KEY = "velum:lastRolePath";

// Where a role lands when there's no remembered page for it yet — first item of that role's own
// header.jsx ROLE_NAV_ITEMS list.
export const DEFAULT_ROLE_PATH = {
  [SITE_ROLES.ORGANIZER]: "/app/my-events",
  [SITE_ROLES.SUBSCRIBER]: "/app/explore-events",
};

// The only pages a role can be remembered on: its own nav pages (header.jsx ROLE_NAV_ITEMS).
// header.jsx records every route change under the active role, so without this a visit to any other
// page (the /app hub, /app/verify, an old /app/Settings-profile, a mint link…) became that role's
// "last page" and switching to the role landed there. Stored values are filtered on read too, so a
// browser that already saved one of those self-heals without a manual localStorage clear.
export const ROLE_PAGES = {
  [SITE_ROLES.ORGANIZER]: ["/app/my-events"],
  [SITE_ROLES.SUBSCRIBER]: ["/app/explore-events", "/app/my-subscriptions"],
};

const isRolePage = (role, path) => (ROLE_PAGES[role] ?? []).includes(path);

function readStoredPaths() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(Object.entries(parsed).filter(([role, path]) => isRolePage(role, path)));
  } catch {
    return {};
  }
}

// Where switching to `role` should land right now: its last remembered page, or its default.
// Reads storage fresh, so a component that isn't the one recording (BottomNav.jsx) never acts on a
// stale copy of the history.
export function getRolePath(role) {
  return readStoredPaths()[role] || DEFAULT_ROLE_PATH[role];
}

// Remembers the last /app/* page visited under each site role, so switching roles (or re-entering
// the app via "Get Started") returns to where that role left off instead of always resetting to
// its default page. A role with nothing recorded yet falls back to DEFAULT_ROLE_PATH — see
// header.jsx (records on every route change + drives the role-switch navigation) and
// pages/appHome.jsx (drives the /app hub's per-role card destinations).
export function useLastRolePath() {
  const [paths, setPaths] = useState(readStoredPaths);

  const recordPath = useCallback((role, path) => {
    if (!isRolePage(role, path)) return;
    setPaths((prev) => {
      if (prev[role] === path) return prev;
      const next = { ...prev, [role]: path };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable (private mode, disabled storage) — just won't persist
      }
      return next;
    });
  }, []);

  return [paths, recordPath];
}

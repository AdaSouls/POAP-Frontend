import { useCallback, useState } from "react";
import { SITE_ROLES } from "./useSiteRole";

const STORAGE_KEY = "adasouls:lastRolePath";

// Where a role lands when there's no remembered page for it yet — first item of that role's own
// header.jsx ROLE_NAV_ITEMS list.
export const DEFAULT_ROLE_PATH = {
  [SITE_ROLES.ORGANIZER]: "/app/my-events",
  [SITE_ROLES.SUBSCRIBER]: "/app/explore-events",
};

// "/app" itself (the role-selection hub, pages/appHome.jsx) is never a valid remembered page for
// any role — header.jsx used to record it as one before a fix (a role whose only history was a
// visit to /app became a dead self-link back to /app). Filtered out here too, defensively, so a
// browser that already has that bad value saved from before the fix self-heals on next read
// instead of requiring a manual localStorage clear.
function readStoredPaths() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, path]) => path !== "/app"));
  } catch {
    return {};
  }
}

// Remembers the last /app/* page visited under each site role, so switching roles (or re-entering
// the app via "Get Started") returns to where that role left off instead of always resetting to
// its default page. A role with nothing recorded yet falls back to DEFAULT_ROLE_PATH — see
// header.jsx (records on every route change + drives the role-switch navigation) and
// pages/appHome.jsx (drives the /app hub's per-role card destinations).
export function useLastRolePath() {
  const [paths, setPaths] = useState(readStoredPaths);

  const recordPath = useCallback((role, path) => {
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

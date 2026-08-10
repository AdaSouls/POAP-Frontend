import { useCallback, useState } from "react";

const STORAGE_KEY = "adasouls:siteRole";

export const SITE_ROLES = {
  SUBSCRIBER: "subscriber",
  ORGANIZER: "organizer",
};

function readStoredRole() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === SITE_ROLES.ORGANIZER ? SITE_ROLES.ORGANIZER : SITE_ROLES.SUBSCRIBER;
  } catch {
    return SITE_ROLES.SUBSCRIBER;
  }
}

// Which persona's nav ("Subscriber" browsing/claiming vs. "Organizer" managing events) the user
// wants to see — a UI view preference only, independent of the real on-chain permissions in
// user-roles.provider.jsx (isAdmin/isIssuer). Persisted so it survives closing the browser.
export function useSiteRole() {
  const [role, setRoleState] = useState(readStoredRole);

  const setRole = useCallback((next) => {
    setRoleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (private mode, disabled storage) — role just won't persist
    }
  }, []);

  return [role, setRole];
}

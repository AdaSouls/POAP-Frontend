// The organizer details an identity reuses on every event it creates (the wizard's "Organization
// profile" step, OrganizationProfileFields.jsx). Keyed by caller pk, i.e. by identity: the same in
// every browser once the identity is restored, different for a second identity of the same wallet.
// SDK-free on purpose, like credential-store.ts: backup.ts imports the prefix, so the profile rides
// in the encrypted backup and comes back with a restore. Private while unused; creating an event
// copies it into that event's public metadata JSON (see docs/organizer-profile-design.md).
import { markBackupDirty } from './backup-status';

export const ORGANIZER_PROFILE_PREFIX = 'velum:organizerProfile:';

export const ORGANIZER_PROFILE_FIELDS = ['name', 'addressLine', 'locality', 'region', 'country', 'postalCode'] as const;

export type OrganizerProfile = Partial<Record<(typeof ORGANIZER_PROFILE_FIELDS)[number], string>>;

function key(callerPkHex: string): string {
  return `${ORGANIZER_PROFILE_PREFIX}${callerPkHex}`;
}

// Only the known fields, trimmed, empty ones dropped.
export function cleanOrganizerProfile(profile: Record<string, unknown> | null | undefined): OrganizerProfile {
  const clean: OrganizerProfile = {};
  ORGANIZER_PROFILE_FIELDS.forEach((field) => {
    const value = profile?.[field];
    if (typeof value === 'string' && value.trim()) clean[field] = value.trim();
  });
  return clean;
}

export function getOrganizerProfile(callerPkHex: string | null | undefined): OrganizerProfile | null {
  if (!callerPkHex) return null;
  try {
    const raw = window.localStorage.getItem(key(callerPkHex));
    if (!raw) return null;
    const profile = cleanOrganizerProfile(JSON.parse(raw));
    return Object.keys(profile).length ? profile : null;
  } catch {
    return null;
  }
}

// An all-empty profile removes the entry instead of storing `{}`.
export function saveOrganizerProfile(callerPkHex: string, profile: Record<string, unknown>): OrganizerProfile {
  const clean = cleanOrganizerProfile(profile);
  try {
    if (Object.keys(clean).length) {
      window.localStorage.setItem(key(callerPkHex), JSON.stringify(clean));
    } else {
      window.localStorage.removeItem(key(callerPkHex));
    }
  } catch {
    return clean;
  }
  markBackupDirty();
  return clean;
}

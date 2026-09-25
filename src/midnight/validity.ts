// How long a POAP stays valid — an optional event setting (createEvent.jsx → metadata.validity),
// counted from a different moment per category:
//   Subscription — from the holder's last ownership proof: holding it isn't being an active
//                  subscriber, proving it every so often is. The holder renews by proving again.
//   Event        — from when the POAP was claimed or minted.
//   Credential   — from issuance. Only the issuer renews (by issuing a new one) and can cut it short
//                  by revoking it. Such credentials also carry a private "Valid until" date field
//                  (VALID_UNTIL_FIELD), so a verifier can ask "valid until ≥ today" anonymously.
// The contract knows none of this: validity is a trust signal the app computes and shows, not
// something the chain enforces. SDK-free.

export const VALIDITY_UNITS = ['hours', 'days', 'months', 'years'] as const;
export type ValidityUnit = (typeof VALIDITY_UNITS)[number];
export type Validity = { amount: number; unit: ValidityUnit };

// The private field added automatically to a Credential with validity (attribute-types.ts date field).
export const VALID_UNTIL_FIELD = { label: 'Valid until', type: 'date' as const, auto: 'validUntil' as const };

const HOUR_MS = 60 * 60 * 1000;

export function parseValidity(raw: unknown): Validity | null {
  if (!raw || typeof raw !== 'object') return null;
  const { amount, unit } = raw as Record<string, unknown>;
  const n = Number(amount);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  if (!(VALIDITY_UNITS as readonly string[]).includes(unit as string)) return null;
  return { amount: n, unit: unit as ValidityUnit };
}

// Calendar-aware for months and years (31 Jan + 1 month = 28/29 Feb, not 3 Mar).
export function addValidity(fromMs: number, validity: Validity): number {
  if (validity.unit === 'hours') return fromMs + validity.amount * HOUR_MS;
  if (validity.unit === 'days') return fromMs + validity.amount * 24 * HOUR_MS;
  const date = new Date(fromMs);
  const months = validity.unit === 'months' ? validity.amount : validity.amount * 12;
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.getTime();
}

export function describeValidity(validity: Validity): string {
  const unit = validity.amount === 1 ? validity.unit.slice(0, -1) : validity.unit;
  return `${validity.amount} ${unit}`;
}

// The "Valid until" value a credential is issued with: the UTC calendar day its validity ends.
export function validUntilIso(issuedMs: number, validity: Validity): string {
  return new Date(addValidity(issuedMs, validity)).toISOString().slice(0, 10);
}

// "25/09/2026" or, for validities under a few days, with the time: "25/09/2026 14:30".
export function formatUntil(untilMs: number, validity: Validity | null): string {
  const date = new Date(untilMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  const short = validity && (validity.unit === 'hours' || (validity.unit === 'days' && validity.amount <= 3));
  return short ? `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}` : day;
}

export type ValidityStatus =
  | { state: 'none' } // the event has no validity
  | { state: 'pending' } // needs a starting point it doesn't have yet (Subscription with no proof)
  | { state: 'unknown' } // the starting point couldn't be read
  | { state: 'active' | 'expired'; untilMs: number };

// fromMs: when the validity started counting (last proof / mint), null if there isn't one yet,
// undefined while it's still loading.
export function validityStatus(
  validity: Validity | null,
  fromMs: number | null | undefined,
  nowMs: number = Date.now(),
): ValidityStatus {
  if (!validity) return { state: 'none' };
  if (fromMs === null) return { state: 'pending' };
  if (fromMs === undefined || Number.isNaN(fromMs)) return { state: 'unknown' };
  const untilMs = addValidity(fromMs, validity);
  return { state: untilMs > nowMs ? 'active' : 'expired', untilMs };
}

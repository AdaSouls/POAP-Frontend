// The two links that replace copy-pasting keys when a credential is issued:
//   1. Invite link — the organizer shares it from a Credential event: /app/key#organizer=…&event=…
//      Opening it generates the holder's code for that organizer (keyInvite.jsx).
//   2. Mint link — the holder sends it back: /app/mint#to=<holder code>[&event=…]
//      Opening it opens Mint POAP with the recipient (and event) filled in (mintLink.jsx).
// Everything rides in the URL fragment, which the browser never sends to a server. Nothing in them
// is secret anyway: the organizer's pk is public, and the holder code is a per-organizer pseudonym
// plus a public encryption key (credential-crypto.ts).
import { formatHolderCode, parseHolderCode } from './credential-crypto';

const HEX_64 = /^[0-9a-fA-F]{64}$/;

function fragmentParams(hash: string): URLSearchParams {
  return new URLSearchParams((hash || '').replace(/^#/, ''));
}

export function inviteLink(origin: string, organizerPkHex: string, eventIdHex: string): string {
  return `${origin}/app/key#organizer=${organizerPkHex}&event=${eventIdHex}`;
}

export function parseInviteFragment(hash: string): { organizerPkHex: string; eventIdHex: string | null } | null {
  const params = fragmentParams(hash);
  const organizer = params.get('organizer') || '';
  const event = params.get('event');
  if (!HEX_64.test(organizer)) return null;
  if (event !== null && !HEX_64.test(event)) return null;
  return { organizerPkHex: organizer.toLowerCase(), eventIdHex: event ? event.toLowerCase() : null };
}

export function mintLink(origin: string, holderCode: string, eventIdHex?: string | null): string {
  const event = eventIdHex ? `&event=${eventIdHex}` : '';
  return `${origin}/app/mint#to=${holderCode}${event}`;
}

export function parseMintFragment(hash: string): { holderCode: string; eventIdHex: string | null } | null {
  const params = fragmentParams(hash);
  const to = params.get('to') || '';
  const event = params.get('event');
  if (!parseHolderCode(to)) return null;
  if (event !== null && !HEX_64.test(event)) return null;
  return { holderCode: to.trim(), eventIdHex: event ? event.toLowerCase() : null };
}

type HolderCodeService = {
  getHolderPkHex(issuerId: Uint8Array): Promise<string>;
  getEncryptionKeyPair(issuerId: Uint8Array): Promise<{ publicKeyHex: string }>;
};

// This wallet's code for one organizer: `<holderPk>.<encryptionKey>`, both derived from local_sk,
// so generating it again always gives the same value (see getHolderKey.jsx).
export async function generateHolderCode(service: HolderCodeService, organizerPkHex: string): Promise<string> {
  const organizerId = Uint8Array.from(Buffer.from(organizerPkHex, 'hex'));
  const holderPkHex = await service.getHolderPkHex(organizerId);
  const { publicKeyHex } = await service.getEncryptionKeyPair(organizerId);
  return formatHolderCode(holderPkHex, publicKeyHex);
}

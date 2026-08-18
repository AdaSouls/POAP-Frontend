import { getTokensByOwner, type IndexedToken } from './indexer.service';

export type MyToken = IndexedToken & {
  issuerPkHex: string;
  // Only known for tokens THIS browser claimed itself (claim(), via store_token) — organizer
  // push-mints (mintTo) never touch the recipient's private state, so isSoulbound is undefined
  // for those (soulbound isn't tracked on-chain at all; see poap.compact's burn() comment).
  isSoulbound?: boolean;
};

type HolderPkService = { getHolderPkHex(issuerId: Uint8Array): Promise<string> };
type LocalTokens = Record<string, { tokenId: bigint; isSoulbound: boolean }>; // eventId hex -> record

// Derives every token this wallet holds, across every issuer that has ever created an event, by
// computing this wallet's per-issuer holder pk (see witnesses.ts's deriveHolderPk /
// poap.compact's holder_pk) for each distinct issuer among `events`, then asking the indexer for
// tokens owned by that pk.
//
// This is the only way an organizer's push-mint (mintTo) becomes visible to the recipient: claim()
// no longer has a "reconcile" path that backfills local private state for a token minted before
// this browser ever claimed anything (see poap.compact's claim()/mintTo comments) — the pk-per-
// issuer index on the indexer is now the sole source of truth for "what do I own", local private
// state is just a same-browser convenience cache for isSoulbound.
export async function getMyTokens(
  service: HolderPkService,
  events: { issuerPk: string }[],
  localTokens: LocalTokens,
): Promise<MyToken[]> {
  const issuerPks = Array.from(new Set(events.map((event) => event.issuerPk)));

  const perIssuer = await Promise.all(
    issuerPks.map(async (issuerPkHex) => {
      const issuerIdBytes = Uint8Array.from(Buffer.from(issuerPkHex, 'hex'));
      const holderPkHex = await service.getHolderPkHex(issuerIdBytes);
      const tokens = await getTokensByOwner(holderPkHex);
      return tokens.map((token) => ({ ...token, issuerPkHex }));
    }),
  );

  return perIssuer.flat().map((token) => ({
    ...token,
    isSoulbound: localTokens[token.firstEventId]?.isSoulbound,
  }));
}

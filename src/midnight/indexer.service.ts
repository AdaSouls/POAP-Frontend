// Client for the poap-midnight app-layer REST API (poap-midnight/indexer), which subscribes to
// the Midnight Indexer GraphQL/WS API and mirrors on-chain POAP state into its own Postgres DB.
// See poap-midnight/indexer/src/api/routes/{events,tokens}.ts for the exact response shapes.
//
// NOTE: this API only has on-chain fields — no event name/description/image metadata, and no
// POST /api/events (see the migration plan's "Known limitations"). Attendance history is
// explicitly not indexed (GET /api/tokens/:id/attendance returns 404 by design) — that lives only
// in each wallet's private state.

const BASE_URL = process.env.REACT_APP_MIDNIGHT_INDEXER_API_URL || "http://localhost:3001";

export type IndexedEvent = {
  eventId: string; // hex
  issuerPk: string; // hex
  maxSupply: number;
  expiration: number;
  isActive: boolean;
  isPublicMint: boolean;
  minted: number;
  createdBlock: number | null;
  createdTx: string | null;
  deactivatedBlock: number | null;
};

export type IndexedEventWithLiveTokens = IndexedEvent & { liveTokens: number };

export type IndexedToken = {
  tokenId: number;
  ownerPk: string; // hex
  issuerPk: string; // hex
  firstEventId: string; // hex
  isBurned: boolean;
  mintedBlock: number | null;
  mintedTx: string | null;
  burnedBlock: number | null;
  burnedTx: string | null;
};

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new IndexerNotFoundError(path);
    }
    throw new Error(`Indexer request failed: GET ${path} → ${response.status}`);
  }
  return response.json();
}

export class IndexerNotFoundError extends Error {
  constructor(path: string) {
    super(`Not found: ${path}`);
    this.name = "IndexerNotFoundError";
  }
}

export async function getAllEvents(): Promise<IndexedEvent[]> {
  return getJson<IndexedEvent[]>("/api/events");
}

export async function getEvent(eventIdHex: string): Promise<IndexedEventWithLiveTokens> {
  return getJson<IndexedEventWithLiveTokens>(`/api/events/${eventIdHex}`);
}

export async function getTokensByOwner(ownerPkHex: string): Promise<IndexedToken[]> {
  return getJson<IndexedToken[]>(`/api/tokens/owner/${ownerPkHex}`);
}

export async function getToken(tokenId: number | bigint): Promise<IndexedToken> {
  return getJson<IndexedToken>(`/api/tokens/${tokenId}`);
}

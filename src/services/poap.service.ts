const API_BASE_URL = process.env.REACT_APP_PAIMA_URL;

export interface IPoap {
  poapUuid: string;
  issuerId: number;
  eventId: number;
  tokenId: number;
  ownerAddress: string;
  createdAt: string;
  updatedAt: string;
  // Blockchain metadata (added in schema updates)
  block_number?: number | null;
  transaction_hash?: string | null;
  // Additional fields from API response
  instance?: string;
  events?: IPoapEvent[];
  // Fields from joined queries (with aliases to avoid conflicts)
  poap_issuerId?: number;
  poap_eventId?: number;
  poap_createdAt?: string;
  poap_updatedAt?: string;
  poap_block_number?: number | null;
  poap_transaction_hash?: string | null;
  event_issuerId?: number;
  event_block_number?: number | null;
  event_transaction_hash?: string | null;
  event_createdAt?: string;
  event_updatedAt?: string;
  // Additional fields that may come from the API
  maxSupply?: number;
  organiserAddress?: string;
  status?: string;
}

export interface IPoapEvent {
  eventUuid: string;
  issuerId: number;
  eventId: number;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  imageUrl?: string | null;
  maxSupply?: number;
  organiserAddress?: string;
  status?: string;
  totalSupply?: number | null;
  eventStartDate?: number | null;
  eventEndDate?: string | null;
  expiration?: number;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  block_number?: number | null;
  transaction_hash?: string | null;
  isExpired?: boolean;
  // Legacy fields for backward compatibility
  eventIdInContract?: number;
  issuerIdInContract?: number;
  expiryDate?: string;
  poapsToBeMinted?: number;
  mintedPoaps?: number;
}

export async function getUserPoaps(ownerAddress: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/owner_poaps?ownerAddress=${ownerAddress}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok: " + response.statusText);
    }
    const { poaps } = await response.json();
    return poaps;
  } catch (error) {
    console.error("Error fetching user POAPs:", error);
    throw error;
  }
}

export async function getAllPoaps() {
  try {
    const response = await fetch(`${API_BASE_URL}/get_all_poaps`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok: " + response.statusText);
    }
    const { poaps } = await response.json();
    return poaps;
  } catch (error) {
    console.error("Error fetching all POAPs:", error);
    throw error;
  }
}

/**
 * Get POAP(s) by tokenId
 * NOTE: tokenId is NOT unique, so this returns an array of POAPs.
 * Multiple POAPs can have the same tokenId from different transactions.
 * @param tokenId - The token ID to search for
 * @returns Array of POAPs with the given tokenId
 */
export async function getPoapById(tokenId: number): Promise<IPoap[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/get_poap/${tokenId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok: " + response.statusText);
    }
    const poaps = await response.json();
    // Ensure we always return an array
    return Array.isArray(poaps) ? poaps : [poaps];
  } catch (error) {
    console.error("Error fetching POAP:", error);
    throw error;
  }
}

export async function getPoapsByEvent(eventId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/get_poaps_by_event?eventId=${eventId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok: " + response.statusText);
    }
    const { poaps } = await response.json();
    return poaps;
  } catch (error) {
    console.error("Error fetching POAPs by event:", error);
    throw error;
  }
}

export async function createPoapForEvent(eventId: number, issuerId: number, ownerAddress: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/create_poap_for_event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId, issuerId, ownerAddress }),
    });
    if (!response.ok) {
      throw new Error("Network response was not ok: " + response.statusText);
    }
    const poap = await response.json();
    return poap;
  } catch (error) {
    console.error("Error creating POAP for event:", error);
    throw error;
  }
}

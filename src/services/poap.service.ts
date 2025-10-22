const API_BASE_URL = process.env.REACT_APP_PAIMA_URL;

export interface IPoap {
  poapUuid: string;
  issuerId: number;
  eventId: number;
  tokenId: number;
  ownerAddress: string;
  createdAt: string;
  updatedAt: string;
  // Additional fields from API response
  instance?: string;
  events?: any[];
}

export interface IPoapEvent {
  eventIdInContract: number;
  issuerIdInContract: number;
  title: string;
  description: string;
  image: string;
  createdAt: string;
  expiryDate: string;
  poapsToBeMinted: number;
  mintedPoaps: number;
  isExpired: boolean;
}

export async function getUserPoaps(ownerAddress: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/owner_poaps?walletAddress=${ownerAddress}`, {
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

export async function getPoapById(tokenId: number) {
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
    const poap = await response.json();
    return poap;
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

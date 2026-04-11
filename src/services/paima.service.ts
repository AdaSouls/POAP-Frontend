const baseUrl = process.env.REACT_APP_PAIMA_URL;

export type DateOrString = Date | string;

export interface ICreateEventParams {
  account?: string | null | void;
  amountOfAttendees?: number | null | void;
  city?: string | null | void;
  country?: string | null | void;
  description: string;
  email: string;
  endDate: DateOrString;
  eventTemplateId?: string | null | void;
  eventType: string;
  eventUrl?: string | null | void;
  expiryDate: DateOrString;
  image: string;
  issuerUuid: string;
  platform?: string | null | void;
  poapsToBeMinted: number;
  poapType: string;
  privateEvent: boolean;
  purpose?: string | null | void;
  requestedCodes: number;
  secretCode?: string | null | void;
  startDate: DateOrString;
  title: string;
  virtualEvent: boolean;
  year: number;
}

export interface IGetAllEventsResult {
  account: string | null;
  amountOfAttendees: number | null;
  approved: string;
  city: string | null;
  country: string | null;
  createdAt: Date | null;
  description: string;
  email: string;
  endDate: Date | null;
  eventIdInContract: number;
  eventTemplateId: string | null;
  eventType: string;
  eventUrl: string | null;
  eventUuid: string;
  expiryDate: Date | null;
  image: string;
  issuerIdInContract: number;
  issuerUuid: string;
  mintedPoaps: number;
  platform: string | null;
  poapsToBeMinted: number;
  poapType: string;
  privateEvent: boolean;
  purpose: string | null;
  requestedCodes: number;
  secretCode: string | null;
  startDate: Date;
  title: string;
  updatedAt: Date | null;
  virtualEvent: boolean;
  year: number | null;
  expiration?: number | null;
  // Add missing fields from backend API response
  transaction_hash?: string | null;
  block_number?: number | null;
  // Also add fields that match the actual backend response structure
  eventId?: number;
  issuerId?: number;
  organiserAddress?: string;
  imageUrl?: string | null;
  eventStartDate?: number | null; // Unix timestamp in seconds (same type as expiration)
  eventEndDate?: string | null;
  totalSupply?: number;
  maxSupply?: number;
}

export interface ICreateIssuerParams {
  address: string;
  email: string;
  name: string;
  organization: string;
}

export interface ICreateOwnerParams {
  address: string;
  email?: string | null | void;
}

export async function getAllEventsService() {
  try {
    const response = await fetch(`${baseUrl}/get_all_events`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok" + response.statusText);
    }
    const events = await response.json();
    return events;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export async function createEventService(eventInfo: ICreateEventParams) {
  try {
    const response = await fetch(`${baseUrl}/create_event`, {
      method: "POST",
      body: JSON.stringify(eventInfo),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok" + response.statusText);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export async function getIssuerByAddressService(address: string) {
  try {
    const response = await fetch(
      `${baseUrl}/get_issuer_by_address?walletAddress=${address}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      // 400 Bad Request typically means issuer not found - return null instead of throwing
      if (response.status === 400) {
        return null;
      }
      throw new Error("Network response was not ok" + response.statusText);
    }
    const { issuer } = await response.json();
    return issuer;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export async function createIssuerService(issuerInfo: ICreateIssuerParams) {
  try {
    const response = await fetch(`${baseUrl}/create_issuer`, {
      method: "POST",
      body: JSON.stringify(issuerInfo),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok" + response.statusText);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export async function createOwnerService(ownerInfo: ICreateOwnerParams) {
  try {
    const response = await fetch(`${baseUrl}/create_owner`, {
      method: "POST",
      body: JSON.stringify(ownerInfo),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok" + response.statusText);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export async function getOwnerPoapsService(ownerAddress: string) {
  try {
    const response = await fetch(
      `${baseUrl}/owner_poaps?ownerAddress=${ownerAddress}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      // 400 Bad Request typically means owner not found - return empty array
      if (response.status === 400) {
        return [];
      }
      throw new Error("Network response was not ok" + response.statusText);
    }
    const poaps = await response.json();
    return poaps;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export async function getOwnerByAddressService(address: string) {
  try {
    const response = await fetch(
      `${baseUrl}/get_owner_by_address?walletAddress=${address}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      // 400 Bad Request typically means owner not found - return null
      if (response.status === 400) {
        return null;
      }
      throw new Error("Network response was not ok" + response.statusText);
    }
    const { owner } = await response.json();
    return owner;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

// get_all_poaps
export async function getAllPoapsService() {
  try {
    const response = await fetch(`${baseUrl}/get_all_poaps`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok" + response.statusText);
    }
    const poaps = await response.json();
    return poaps;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}
const API_BASE_URL = process.env.REACT_APP_PAIMA_URL;

export interface IEvent {
  eventUuid: string;
  issuerId: number;
  eventId: number;
  maxSupply: number;
  expiration: number;
  organiserAddress: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Additional fields from the API response
  title?: string;
  description?: string;
  image?: string;
  eventType?: string;
  poapsToBeMinted?: number;
  mintedPoaps?: number;
  expiryDate?: string;
  isExpired?: boolean;
  // Blockchain metadata fields
  transaction_hash?: string | null;
  block_number?: number | null;
  imageUrl?: string | null;
  eventStartDate?: string | null;
  eventEndDate?: string | null;
}

export interface IEventFilters {
  organiserAddress?: string;
  issuerId?: number;
  status?: string;
  expired?: string; // 'true' or 'false' as string for API
  titleSearch?: string;
  sortBy?: 'createdAt' | 'eventStartDate' | 'expiration' | 'title';
  order?: 'asc' | 'desc';
}

export async function getAllEvents(filters?: IEventFilters) {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters) {
      if (filters.organiserAddress) queryParams.append('organiserAddress', filters.organiserAddress);
      if (filters.issuerId !== undefined) queryParams.append('issuerId', filters.issuerId.toString());
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.expired !== undefined) queryParams.append('expired', filters.expired);
      if (filters.titleSearch) queryParams.append('titleSearch', filters.titleSearch);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.order) queryParams.append('order', filters.order);
    }

    const url = `${API_BASE_URL}/get_all_events${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok: " + response.statusText);
    }
    const events = await response.json();
    return events;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

export async function getEventById(eventId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/get_event/${eventId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok: " + response.statusText);
    }
    const event = await response.json();
    return event;
  } catch (error) {
    console.error("Error fetching event:", error);
    throw error;
  }
}

export async function getEventsByOrganizer(organizerAddress: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/get_events_by_organizer?address=${organizerAddress}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok: " + response.statusText);
    }
    const events = await response.json();
    return events;
  } catch (error) {
    console.error("Error fetching organizer events:", error);
    throw error;
  }
}

export async function createEvent(eventData: any) {
  try {
    const response = await fetch(`${API_BASE_URL}/create_event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });
    
    // Get response text first to check if it's empty
    const responseText = await response.text();
    
    if (!response.ok) {
      // Try to parse error response if it's JSON
      let errorMessage = response.statusText;
      if (responseText) {
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.details || errorData.message || response.statusText;
        } catch {
          errorMessage = responseText || response.statusText;
        }
      }
      throw new Error(`Network response was not ok: ${response.status} ${errorMessage}`);
    }
    
    // Check if response is empty
    if (!responseText || responseText.trim() === "") {
      throw new Error("Server returned an empty response");
    }
    
    // Parse JSON response
    try {
      const event = JSON.parse(responseText);
      return event;
    } catch (parseError) {
      console.error("Failed to parse response as JSON:", responseText);
      const error = parseError as Error;
      throw new Error(`Invalid JSON response from server: ${error.message}`);
    }
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
}

export async function updateEventStatus(eventId: number, status: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/update_event_status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId, status }),
    });
    if (!response.ok) {
      throw new Error("Network response was not ok: " + response.statusText);
    }
    const event = await response.json();
    return event;
  } catch (error) {
    console.error("Error updating event status:", error);
    throw error;
  }
}

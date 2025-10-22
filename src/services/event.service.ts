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
}

export async function getAllEvents() {
  try {
    const response = await fetch(`${API_BASE_URL}/get_all_events`, {
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
    if (!response.ok) {
      throw new Error("Network response was not ok: " + response.statusText);
    }
    const event = await response.json();
    return event;
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

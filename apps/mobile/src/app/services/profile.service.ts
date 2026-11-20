import type { Profile, CreateProfileDTO, Meeting, CreateMeetingDTO, CalendarEvent } from "../models";

const API_URL = "http://localhost:8787";

class ProfileService {
  async getProfile(slug: string): Promise<Profile | null> {
    try {
      const res = await fetch(`${API_URL}/profiles/${slug}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async saveProfile(dto: CreateProfileDTO): Promise<Profile | null> {
    try {
      const res = await fetch(`${API_URL}/profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async getCalendarEvents(profileId: string): Promise<CalendarEvent[]> {
    try {
      const res = await fetch(`${API_URL}/profiles/${profileId}/calendar-events`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  async getMeetings(hostId: string): Promise<Meeting[]> {
    try {
      const res = await fetch(`${API_URL}/meetings/${hostId}`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  async createMeeting(dto: CreateMeetingDTO): Promise<Meeting | null> {
    try {
      const res = await fetch(`${API_URL}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
}

export const profileService = new ProfileService();

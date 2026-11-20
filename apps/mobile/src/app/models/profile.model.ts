export interface Profile {
  id: string;
  slug: string;
  name: string;
  email: string;
  timezone: string;
  slotDurationMinutes: number;
  workDays: string;
  startHour: string;
  endHour: string;
  googleToken?: string;
  createdAt?: string;
}

export interface CreateProfileDTO {
  slug: string;
  name: string;
  email: string;
  slotDurationMinutes?: number;
  startHour?: string;
  endHour?: string;
  timezone?: string;
  workDays?: string;
  googleToken?: string;
}

export interface Meeting {
  id: string;
  hostId: string;
  guestName: string;
  guestEmail: string;
  title: string;
  startTime: string;
  endTime: string;
  meetLink: string;
  status: string;
  createdAt?: string;
}

export interface CreateMeetingDTO {
  hostId: string;
  guestName: string;
  guestEmail: string;
  title: string;
  startTime: string;
  endTime: string;
  googleToken?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  hangoutLink?: string;
  htmlLink?: string;
}

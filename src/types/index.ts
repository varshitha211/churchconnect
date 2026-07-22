export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  churchId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Church {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  timezone: string;
}

export interface Member {
  id: string;
  churchId: string;
  fullName: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  ageGroup?: string;
  gender?: string;
  area?: string;
  isSubscribed: boolean;
  isArchived: boolean;
  createdAt: Date;
}

export interface Event {
  id: string;
  churchId: string;
  createdBy: string;
  name: string;
  slug: string;
  category: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  startTime: string;
  venue: string;
  locationLink?: string;
  posterImage?: string;
  organizerContact?: string;
  registrationReq: boolean;
  voiceEnabled: boolean;
  rsvpEnabled: boolean;
  qrAttendance: boolean;
  status: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalMembers: number;
  activeEvents: number;
  upcomingEvents: number;
  notificationsSent: number;
  notificationsOpened: number;
  whatsappPrepared: number;
  whatsappSent: number;
  totalCalls: number;
  callsAnswered: number;
  callsNoAnswer: number;
  callsBusy: number;
  callsFailed: number;
  totalRsvp: number;
  totalAttendance: number;
}

export interface EventAnalytics {
  eventId: string;
  eventName: string;
  totalInvited: number;
  notificationsSent: number;
  notificationsOpened: number;
  attending: number;
  maybe: number;
  notAttending: number;
  noResponse: number;
  callsAttempted: number;
  callsAnswered: number;
  callsNoAnswer: number;
  callsBusy: number;
  callsFailed: number;
  checkedIn: number;
}

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

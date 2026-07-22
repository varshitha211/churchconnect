export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "ChurchConnect";
export const CHURCH_NAME =
  process.env.NEXT_PUBLIC_CHURCH_NAME || "Sion Holy Church";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  CHURCH_ADMIN: "CHURCH_ADMIN",
  MEMBER: "MEMBER",
} as const;

export const EVENT_CATEGORIES = [
  "Sunday_Service",
  "Prayer_Meeting",
  "Youth_Conference",
  "Christmas_Celebration",
  "Gospel_Meeting",
  "Youth_Retreat",
  "Womens_Meeting",
  "Children_Program",
  "Urgent_Announcement",
  "Other",
] as const;

export const EVENT_STATUSES = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;

export const RSVP_RESPONSES = {
  ATTENDING: "ATTENDING",
  MAYBE: "MAYBE",
  NOT_ATTENDING: "NOT_ATTENDING",
} as const;

export const CALL_STATUSES = {
  QUEUED: "QUEUED",
  INITIATED: "INITIATED",
  RINGING: "RINGING",
  ANSWERED: "ANSWERED",
  COMPLETED: "COMPLETED",
  NO_ANSWER: "NO_ANSWER",
  BUSY: "BUSY",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

export const CAMPAIGN_STATUSES = {
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const COMMUNICATION_CHANNELS = {
  PUSH: "PUSH",
  WHATSAPP: "WHATSAPP",
  SMS: "SMS",
  EMAIL: "EMAIL",
  CALL: "CALL",
} as const;

export const COMMUNICATION_STATUSES = {
  PREPARED: "PREPARED",
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  OPENED: "OPENED",
  FAILED: "FAILED",
} as const;

export const AGE_GROUPS = ["CHILD", "YOUTH", "ADULT", "SENIOR"] as const;
export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;

export const FOLLOW_UP_REASONS = [
  "NO_RSVP",
  "UNANSWERED_CALL",
  "NOT_OPENED",
  "NOT_SUBSCRIBED",
] as const;

export const ITEMS_PER_PAGE = 20;

export const CATEGORY_LABELS: Record<string, string> = {
  Sunday_Service: "Sunday Service",
  Prayer_Meeting: "Prayer Meeting",
  Youth_Conference: "Youth Conference",
  Christmas_Celebration: "Christmas Celebration",
  Gospel_Meeting: "Gospel Meeting",
  Youth_Retreat: "Youth Retreat",
  Womens_Meeting: "Women's Meeting",
  Children_Program: "Children's Program",
  Urgent_Announcement: "Urgent Announcement",
  Other: "Other",
};

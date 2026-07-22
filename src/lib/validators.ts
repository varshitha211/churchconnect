import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const memberSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(15),
  whatsappNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  ageGroup: z.enum(["CHILD", "YOUTH", "ADULT", "SENIOR"]).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  area: z.string().optional(),
  isSubscribed: z.boolean().default(true),
});

export const eventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(200),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  venue: z.string().min(1, "Venue is required"),
  locationLink: z.string().url().optional().or(z.literal("")),
  organizerContact: z.string().optional(),
  registrationReq: z.boolean().default(false),
  voiceEnabled: z.boolean().default(true),
  rsvpEnabled: z.boolean().default(true),
  qrAttendance: z.boolean().default(true),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]).default("DRAFT"),
});

export const rsvpSchema = z.object({
  response: z.enum(["ATTENDING", "MAYBE", "NOT_ATTENDING"]),
  guestName: z.string().optional(),
  guestCount: z.number().min(0).max(20).default(0),
  prayerRequest: z.string().optional(),
  message: z.string().optional(),
});

export const templateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100),
  subject: z.string().optional(),
  body: z.string().min(1, "Message body is required"),
  isDefault: z.boolean().default(false),
});

export const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  maxRetries: z.number().min(0).max(5).default(2),
  retryDelayMin: z.number().min(5).max(1440).default(30),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type MemberInput = z.infer<typeof memberSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type RsvpInput = z.infer<typeof rsvpSchema>;
export type TemplateInput = z.infer<typeof templateSchema>;
export type CampaignInput = z.infer<typeof campaignSchema>;

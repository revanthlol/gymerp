import { z } from "zod";

export const createMemberSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(7, "Phone number required").max(30),
  gender: z.enum(["Male", "Female", "Other", "Unspecified"]).default("Unspecified"),
  dateOfBirth: z.string().optional().or(z.literal("")),
  emergencyContact: z.string().optional().or(z.literal("")),
  planId: z.string().uuid("Invalid plan selection").optional().or(z.literal("")),
  isVip: z.boolean().default(false),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;

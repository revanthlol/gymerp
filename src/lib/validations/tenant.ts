import { z } from "zod";

export const createTenantSchema = z.object({
  name: z.string().min(2, "Gym name must be at least 2 characters").max(80),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  contactEmail: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Valid phone number required").max(20),
  adminFullName: z.string().min(2, "Admin full name is required"),
  initialStatus: z.enum(["trial", "active"]).default("active"),
  licenseDurationDays: z.coerce.number().int().positive().default(365),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;

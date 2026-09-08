DO $$ BEGIN CREATE TYPE "public"."member_status" AS ENUM('active', 'expired', 'frozen'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."membership_status" AS ENUM('active', 'expired', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."payment_method" AS ENUM('razorpay', 'manual'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."tenant_status" AS ENUM('trial', 'active', 'suspended'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."user_role" AS ENUM('platform', 'admin', 'staff'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"checked_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"method" text DEFAULT 'qr' NOT NULL,
	"kiosk_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"gender" text,
	"date_of_birth" date,
	"emergency_contact" text,
	"avatar_url" text,
	"status" "member_status" DEFAULT 'active' NOT NULL,
	"qr_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"join_date" date DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_qr_token_unique" UNIQUE("qr_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "membership_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"duration_days" integer NOT NULL,
	"is_active" text DEFAULT 'true' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"auto_renew" text DEFAULT 'false' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"membership_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"method" "payment_method" NOT NULL,
	"status" "payment_status" NOT NULL,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"notes" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" "tenant_status" DEFAULT 'trial' NOT NULL,
	"contact_email" text,
	"phone" text,
	"logo_url" text,
	"license_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firebase_uid" text NOT NULL,
	"tenant_id" uuid,
	"role" "user_role" NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid")
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_plans" ADD CONSTRAINT "membership_plans_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_plan_id_membership_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."membership_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attendance_tenant_idx" ON "attendance" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attendance_member_idx" ON "attendance" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attendance_date_idx" ON "attendance" USING btree ("checked_in_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "members_tenant_idx" ON "members" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "members_qr_token_idx" ON "members" USING btree ("qr_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "members_phone_idx" ON "members" USING btree ("phone");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plans_tenant_idx" ON "membership_plans" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memberships_tenant_idx" ON "memberships" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memberships_member_idx" ON "memberships" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memberships_end_date_idx" ON "memberships" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_tenant_idx" ON "payments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_member_idx" ON "payments" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_tenant_idx" ON "users" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_firebase_uid_idx" ON "users" USING btree ("firebase_uid");
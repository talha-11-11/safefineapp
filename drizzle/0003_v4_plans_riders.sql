ALTER TABLE "customers" ADD COLUMN "payment_plan" text DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "created_by" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "created_by" text DEFAULT '' NOT NULL;
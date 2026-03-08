CREATE TABLE "exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_currency" text DEFAULT 'USD' NOT NULL,
	"target_currency" text NOT NULL,
	"rate" numeric(14, 4) NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "exchange_rates_base_currency_target_currency_unique" UNIQUE("base_currency","target_currency")
);

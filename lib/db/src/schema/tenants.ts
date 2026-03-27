import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const tenantStatusEnum = pgEnum("tenant_status", ["active", "blocked"]);
export const tenantPlanEnum = pgEnum("tenant_plan", ["basic", "professional", "enterprise"]);

export const tenantsTable = pgTable("tenants", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  whatsapp: text("whatsapp"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color"),
  status: tenantStatusEnum("status").notNull().default("active"),
  plan: tenantPlanEnum("plan").notNull().default("basic"),
  planPrice: text("plan_price").notNull().default("0"),
  blockAt: timestamp("block_at"),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTenantSchema = createInsertSchema(tenantsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenantsTable.$inferSelect;

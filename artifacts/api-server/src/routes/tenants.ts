import { Router } from "express";
import { db, tenantsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireTenant, type AuthRequest } from "../lib/auth.js";
import { z } from "zod";

const router = Router();

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  whatsapp: z.string().optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
});

function formatTenant(tenant: typeof tenantsTable.$inferSelect) {
  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    email: "",
    whatsapp: tenant.whatsapp ?? null,
    logoUrl: tenant.logoUrl ?? null,
    primaryColor: tenant.primaryColor ?? null,
    secondaryColor: tenant.secondaryColor ?? null,
    status: tenant.status,
    plan: tenant.plan,
    createdAt: tenant.createdAt.toISOString(),
  };
}

router.get("/me", requireTenant, async (req: AuthRequest, res) => {
  try {
    const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, req.user!.tenantId!)).limit(1);

    if (!tenant) {
      res.status(404).json({ error: "NotFound", message: "Tenant não encontrado" });
      return;
    }

    res.json(formatTenant(tenant));
  } catch (err) {
    req.log.error({ err }, "Get tenant error");
    res.status(500).json({ error: "InternalError", message: "Erro interno" });
  }
});

router.patch("/me", requireTenant, async (req: AuthRequest, res) => {
  const parsed = updateTenantSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: "Dados inválidos" });
    return;
  }

  try {
    const [updated] = await db
      .update(tenantsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(tenantsTable.id, req.user!.tenantId!))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "NotFound", message: "Tenant não encontrado" });
      return;
    }

    res.json(formatTenant(updated));
  } catch (err) {
    req.log.error({ err }, "Update tenant error");
    res.status(500).json({ error: "InternalError", message: "Erro interno" });
  }
});

router.get("/public/:slug", async (req, res) => {
  try {
    const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.slug, req.params.slug!)).limit(1);

    if (!tenant || tenant.status === "blocked") {
      res.status(404).json({ error: "NotFound", message: "Salon não encontrado" });
      return;
    }

    res.json({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      whatsapp: tenant.whatsapp ?? null,
      logoUrl: tenant.logoUrl ?? null,
      primaryColor: tenant.primaryColor ?? null,
      secondaryColor: tenant.secondaryColor ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Get public tenant error");
    res.status(500).json({ error: "InternalError", message: "Erro interno" });
  }
});

export default router;

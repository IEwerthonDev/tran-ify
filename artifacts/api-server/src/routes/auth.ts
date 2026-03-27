import { Router } from "express";
import { db, usersTable, tenantsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, comparePassword, hashPassword, requireAuth, type AuthRequest } from "../lib/auth.js";
import { z } from "zod";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: "Invalid email or password format" });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);

    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "Email ou senha inválidos" });
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Unauthorized", message: "Email ou senha inválidos" });
      return;
    }

    let tenantId: string | undefined;
    let tenantSlug: string | undefined;

    if (user.role === "tenant") {
      const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.userId, user.id)).limit(1);
      if (tenant) {
        if (tenant.status === "blocked") {
          const now = new Date();
          const blockAt = tenant.blockAt;
          if (!blockAt || blockAt <= now) {
            res.status(403).json({ error: "Forbidden", message: "Sua conta está bloqueada. Entre em contato com o suporte." });
            return;
          }
        }
        tenantId = tenant.id;
        tenantSlug = tenant.slug;
        await db.update(tenantsTable).set({ lastActiveAt: new Date() }).where(eq(tenantsTable.id, tenant.id));
      }
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as "tenant" | "super_admin",
      tenantId,
      tenantSlug,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: tenantId ?? null,
        tenantSlug: tenantSlug ?? null,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "InternalError", message: "Erro interno" });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ message: "Logout realizado com sucesso" });
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!;
  res.json({
    id: user.userId,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId ?? null,
    tenantSlug: user.tenantSlug ?? null,
  });
});

router.post("/change-password", requireAuth, async (req: AuthRequest, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: "Dados inválidos" });
    return;
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);

    if (!user) {
      res.status(404).json({ error: "NotFound", message: "Usuário não encontrado" });
      return;
    }

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Unauthorized", message: "Senha atual incorreta" });
      return;
    }

    const newHash = await hashPassword(newPassword);
    await db.update(usersTable).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(usersTable.id, user.id));

    res.json({ message: "Senha alterada com sucesso" });
  } catch (err) {
    req.log.error({ err }, "Change password error");
    res.status(500).json({ error: "InternalError", message: "Erro interno" });
  }
});

export default router;

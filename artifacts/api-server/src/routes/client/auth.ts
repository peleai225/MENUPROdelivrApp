import { Router, type IRouter } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { db, customersTable, authTokensTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../../middlewares/auth";

const router: IRouter = Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

function hashPassword(plain: string): string {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex"); // 64 hex chars
}

function tokenExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30); // 30-day expiry
  return d;
}

// ─── Validation schemas ──────────────────────────────────────────────────────

const RegisterBody = z.object({
  name: z.string().min(1),
  phone: z.string().min(6),
  password: z.string().min(4),
  email: z.string().email().optional(),
  city: z.string().optional(),
});

const LoginBody = z.object({
  phone: z.string().min(1),
  password: z.string().min(1),
});

const UpdateProfileBody = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  city: z.string().optional(),
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /register
router.post("/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation error", errors: parsed.error.issues });
    return;
  }
  const { name, phone, password, email, city } = parsed.data;

  // Check duplicate phone
  const existing = await db
    .select({ id: customersTable.id })
    .from(customersTable)
    .where(eq(customersTable.phone, phone))
    .limit(1);

  if (existing.length > 0) {
    res.status(400).json({ message: "Phone number already registered" });
    return;
  }

  const [customer] = await db
    .insert(customersTable)
    .values({ name, phone, password_hash: hashPassword(password), email, city })
    .returning();

  const token = generateToken();
  await db.insert(authTokensTable).values({
    customer_id: customer.id,
    token,
    expires_at: tokenExpiresAt(),
  });

  res.status(201).json({ token, customer });
});

// POST /login
router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation error", errors: parsed.error.issues });
    return;
  }
  const { phone, password } = parsed.data;

  const rows = await db
    .select()
    .from(customersTable)
    .where(
      and(
        eq(customersTable.phone, phone),
        eq(customersTable.password_hash, hashPassword(password)),
      ),
    )
    .limit(1);

  if (rows.length === 0) {
    res.status(401).json({ message: "Invalid phone or password" });
    return;
  }

  const customer = rows[0];
  const token = generateToken();
  await db.insert(authTokensTable).values({
    customer_id: customer.id,
    token,
    expires_at: tokenExpiresAt(),
  });

  res.json({ token, customer });
});

// GET /me
router.get("/me", requireAuth, (req, res) => {
  res.json({ customer: req.customer });
});

// POST /logout
router.post("/logout", requireAuth, async (req, res) => {
  const rawToken = req.headers.authorization?.slice(7) ?? "";
  await db
    .delete(authTokensTable)
    .where(eq(authTokensTable.token, rawToken));
  res.json({ message: "Logged out" });
});

// PATCH /profile
router.patch("/profile", requireAuth, async (req, res) => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation error", errors: parsed.error.issues });
    return;
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ message: "No fields to update" });
    return;
  }

  const [updated] = await db
    .update(customersTable)
    .set(updates)
    .where(eq(customersTable.id, req.customer!.id))
    .returning();

  res.json({ customer: updated });
});

export default router;

import { Router, type IRouter } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { addresses } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../../middlewares/auth";

const router: IRouter = Router();

// ── Validation schemas ──────────────────────────────────────────────────────

const CreateAddressSchema = z.object({
  label: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  zone: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  instructions: z.string().optional(),
  is_default: z.boolean().optional().default(false),
});

const UpdateAddressSchema = CreateAddressSchema.partial();

// ── GET / — List addresses for the authenticated customer ───────────────────

router.get("/", requireAuth, async (req, res) => {
  const customerId = req.customer!.id;

  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.customer_id, customerId));

  res.json(rows);
});

// ── POST / — Create a new address ───────────────────────────────────────────

router.post("/", requireAuth, async (req, res) => {
  const parsed = CreateAddressSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ message: "Données invalides", errors: parsed.error.flatten() });
  }

  const customerId = req.customer!.id;
  const data = parsed.data;

  // If this address will be the default, clear existing defaults first.
  if (data.is_default) {
    await db
      .update(addresses)
      .set({ is_default: false })
      .where(and(eq(addresses.customer_id, customerId), eq(addresses.is_default, true)));
  }

  const [created] = await db
    .insert(addresses)
    .values({
      customer_id: customerId,
      label: data.label,
      address: data.address,
      city: data.city,
      zone: data.zone ?? null,
      latitude: String(data.latitude),
      longitude: String(data.longitude),
      instructions: data.instructions ?? null,
      is_default: data.is_default,
    })
    .returning();

  res.status(201).json(created);
});

// ── PATCH /:id — Update an address ──────────────────────────────────────────

router.patch("/:id", requireAuth, async (req, res) => {
  const customerId = req.customer!.id;
  const addressId = Number(req.params.id);

  if (Number.isNaN(addressId)) {
    return res.status(400).json({ message: "ID invalide" });
  }

  // Verify ownership
  const [existing] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.customer_id, customerId)));

  if (!existing) {
    return res.status(404).json({ message: "Adresse introuvable" });
  }

  const parsed = UpdateAddressSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ message: "Données invalides", errors: parsed.error.flatten() });
  }

  const data = parsed.data;

  // If setting as default, reset others first.
  if (data.is_default) {
    await db
      .update(addresses)
      .set({ is_default: false })
      .where(and(eq(addresses.customer_id, customerId), eq(addresses.is_default, true)));
  }

  const updatePayload: Partial<typeof addresses.$inferInsert> = {};
  if (data.label !== undefined) updatePayload.label = data.label;
  if (data.address !== undefined) updatePayload.address = data.address;
  if (data.city !== undefined) updatePayload.city = data.city;
  if ("zone" in data) updatePayload.zone = data.zone ?? null;
  if (data.latitude !== undefined) updatePayload.latitude = String(data.latitude);
  if (data.longitude !== undefined) updatePayload.longitude = String(data.longitude);
  if ("instructions" in data) updatePayload.instructions = data.instructions ?? null;
  if (data.is_default !== undefined) updatePayload.is_default = data.is_default;

  const [updated] = await db
    .update(addresses)
    .set(updatePayload)
    .where(eq(addresses.id, addressId))
    .returning();

  res.json(updated);
});

// ── DELETE /:id — Delete an address ─────────────────────────────────────────

router.delete("/:id", requireAuth, async (req, res) => {
  const customerId = req.customer!.id;
  const addressId = Number(req.params.id);

  if (Number.isNaN(addressId)) {
    return res.status(400).json({ message: "ID invalide" });
  }

  // Verify ownership
  const [existing] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.customer_id, customerId)));

  if (!existing) {
    return res.status(404).json({ message: "Adresse introuvable" });
  }

  await db.delete(addresses).where(eq(addresses.id, addressId));

  // If deleted address was the default, promote the first remaining one.
  if (existing.is_default) {
    const remaining = await db
      .select()
      .from(addresses)
      .where(eq(addresses.customer_id, customerId))
      .limit(1);

    if (remaining.length > 0) {
      await db
        .update(addresses)
        .set({ is_default: true })
        .where(eq(addresses.id, remaining[0]!.id));
    }
  }

  res.status(204).send();
});

export default router;

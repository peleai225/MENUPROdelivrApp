import crypto from "node:crypto";
import { Router, type IRouter } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import {
  orders,
  orderItems,
  orderTimelines,
  deliveries,
  drivers,
  payments,
  restaurants,
  dishes,
} from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth } from "../../middlewares/auth";

const router: IRouter = Router();

const PAGE_SIZE = 10;

// ── Validation schemas ──────────────────────────────────────────────────────

const CreateOrderSchema = z.object({
  restaurant_id: z.number().int().positive(),
  items: z
    .array(
      z.object({
        dish_id: z.number().int().positive(),
        quantity: z.number().int().min(1),
        notes: z.string().optional(),
      }),
    )
    .min(1),
  delivery_lat: z.number(),
  delivery_lng: z.number(),
  delivery_address: z.string().min(1),
  delivery_city: z.string().min(1),
  delivery_instructions: z.string().optional(),
  payment_method: z.literal("wave"),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateReference(): string {
  const ts = Date.now();
  const rand = crypto
    .randomBytes(2)
    .toString("hex")
    .toUpperCase()
    .slice(0, 4);
  return `CMD-${ts}${rand}`;
}

function generateTrackingToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

// ── POST / — Create order ────────────────────────────────────────────────────

router.post("/", requireAuth, async (req, res) => {
  const parsed = CreateOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(422)
      .json({ message: "Données invalides", errors: parsed.error.flatten() });
  }

  const customerId = req.customer!.id;
  const payload = parsed.data;

  // Verify restaurant exists
  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, payload.restaurant_id));

  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant introuvable" });
  }

  // Fetch each requested dish (deduped by id)
  const dishMap = new Map<number, typeof dishes.$inferSelect>();
  for (const item of payload.items) {
    if (!dishMap.has(item.dish_id)) {
      const [row] = await db
        .select()
        .from(dishes)
        .where(eq(dishes.id, item.dish_id));
      if (row) dishMap.set(item.dish_id, row);
    }
  }

  // Validate all dishes exist and are available
  for (const item of payload.items) {
    const dish = dishMap.get(item.dish_id);
    if (!dish) {
      return res
        .status(400)
        .json({ message: `Plat #${item.dish_id} introuvable` });
    }
    if (!dish.is_available) {
      return res
        .status(400)
        .json({ message: `Plat "${dish.name}" non disponible` });
    }
  }

  // Calculate totals (prices in XOF centimes)
  let subtotal = 0;
  for (const item of payload.items) {
    const dish = dishMap.get(item.dish_id)!;
    subtotal += dish.price * item.quantity;
  }

  // Base delivery fee: 1500 FCFA (150 000 centimes)
  const deliveryFee = 150000;
  const total = subtotal + deliveryFee;

  const trackingToken = generateTrackingToken();
  const reference = generateReference();

  // Insert order
  const [order] = await db
    .insert(orders)
    .values({
      customer_id: customerId,
      restaurant_id: payload.restaurant_id,
      reference,
      tracking_token: trackingToken,
      status: "pending",
      payment_method: payload.payment_method,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      delivery_lat: String(payload.delivery_lat),
      delivery_lng: String(payload.delivery_lng),
      delivery_address: payload.delivery_address,
      delivery_city: payload.delivery_city,
      delivery_instructions: payload.delivery_instructions ?? null,
      estimated_minutes: restaurant.avg_prep_time ?? 30,
    })
    .returning();

  // Insert order items
  const itemsToInsert = payload.items.map((item) => {
    const dish = dishMap.get(item.dish_id)!;
    return {
      order_id: order!.id,
      dish_id: item.dish_id,
      name: dish.name,
      quantity: item.quantity,
      unit_price: dish.price,
      total: dish.price * item.quantity,
      notes: item.notes ?? null,
    };
  });

  await db.insert(orderItems).values(itemsToInsert);

  // Insert order timeline
  await db.insert(orderTimelines).values({
    order_id: order!.id,
    ordered_at: new Date(),
  });

  // Create payment record
  const paymentUrl = `https://pay.wave.com/m/menupro/${order!.id}`;
  const [payment] = await db
    .insert(payments)
    .values({
      order_id: order!.id,
      payment_method: payload.payment_method,
      amount: total,
      payment_status: "pending",
      payment_url: paymentUrl,
    })
    .returning();

  // Fetch order items to include in the response
  const createdItems = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.order_id, order!.id));

  return res.status(201).json({
    order: {
      ...order,
      items: createdItems.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.total,
      })),
    },
    tracking_token: trackingToken,
    payment_url: payment!.payment_url,
  });
});

// ── GET /history — Paginated order history ───────────────────────────────────

router.get("/history", requireAuth, async (req, res) => {
  const customerId = req.customer!.id;
  const page = Math.max(1, Number(req.query.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [{ total }] = await db
    .select({ total: count() })
    .from(orders)
    .where(eq(orders.customer_id, customerId));

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.customer_id, customerId))
    .orderBy(desc(orders.created_at))
    .limit(PAGE_SIZE)
    .offset(offset);

  // Attach items to each order
  const data = await Promise.all(
    rows.map(async (order) => {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.order_id, order.id));

      return {
        ...order,
        items: items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total: i.total,
        })),
      };
    }),
  );

  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  res.json({
    data,
    current_page: page,
    last_page: lastPage,
    total,
  });
});

// ── GET /track/:token — Public order tracking ────────────────────────────────

router.get("/track/:token", async (req, res) => {
  const { token } = req.params;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.tracking_token, token));

  if (!order) {
    return res.status(404).json({ message: "Commande introuvable" });
  }

  // Fetch delivery record (may not exist yet)
  const [delivery] = await db
    .select()
    .from(deliveries)
    .where(eq(deliveries.order_id, order.id));

  // Fetch timeline
  const [timeline] = await db
    .select()
    .from(orderTimelines)
    .where(eq(orderTimelines.order_id, order.id));

  const statusLabels: Record<string, string> = {
    pending: "En attente",
    assigned: "Livreur assigné",
    picked_up: "Récupéré au restaurant",
    on_the_way: "En chemin",
    delivered: "Livré",
    failed: "Échec de livraison",
  };

  let deliveryPayload: {
    status: string;
    status_label: string;
    driver: {
      name: string;
      phone: string;
      latitude: number;
      longitude: number;
      rating: string;
    } | null;
  } | null = null;

  if (delivery) {
    let driverPayload: {
      name: string;
      phone: string;
      latitude: number;
      longitude: number;
      rating: string;
    } | null = null;

    if (delivery.driver_id) {
      const [driver] = await db
        .select()
        .from(drivers)
        .where(eq(drivers.id, delivery.driver_id));

      if (driver) {
        driverPayload = {
          name: driver.name,
          phone: driver.phone,
          latitude: Number(driver.current_lat),
          longitude: Number(driver.current_lng),
          rating: String(driver.rating ?? "0"),
        };
      }
    }

    deliveryPayload = {
      status: delivery.status,
      status_label: statusLabels[delivery.status] ?? delivery.status,
      driver: driverPayload,
    };
  }

  res.json({
    order_status: order.status,
    estimated_minutes: order.estimated_minutes ?? 30,
    delivery: deliveryPayload,
    timeline: {
      ordered_at: timeline?.ordered_at?.toISOString() ?? null,
      confirmed_at: timeline?.confirmed_at?.toISOString() ?? null,
      preparing_at: timeline?.preparing_at?.toISOString() ?? null,
      ready_at: timeline?.ready_at?.toISOString() ?? null,
      driver_assigned_at: timeline?.driver_assigned_at?.toISOString() ?? null,
      picked_up_at: timeline?.picked_up_at?.toISOString() ?? null,
      completed_at: timeline?.completed_at?.toISOString() ?? null,
    },
  });
});

// ── POST /:id/cancel — Cancel an order ──────────────────────────────────────

router.post("/:id/cancel", requireAuth, async (req, res) => {
  const customerId = req.customer!.id;
  const orderId = Number(req.params.id);

  if (Number.isNaN(orderId)) {
    return res.status(400).json({ message: "ID invalide" });
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.customer_id, customerId)));

  if (!order) {
    return res.status(404).json({ message: "Commande introuvable" });
  }

  const cancellableStatuses = ["pending", "confirmed"];
  if (!cancellableStatuses.includes(order.status)) {
    return res.status(400).json({ message: "Commande non annulable" });
  }

  const [cancelled] = await db
    .update(orders)
    .set({ status: "cancelled" })
    .where(eq(orders.id, orderId))
    .returning();

  res.json(cancelled);
});

export default router;

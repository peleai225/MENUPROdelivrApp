import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { orders, payments } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../../middlewares/auth";

const router: IRouter = Router();

// ── POST /:orderId/initiate — Initiate or retrieve a payment ─────────────────

router.post("/:orderId/initiate", requireAuth, async (req, res) => {
  const customerId = req.customer!.id;
  const orderId = Number(req.params.orderId);

  if (Number.isNaN(orderId)) {
    return res.status(400).json({ message: "ID invalide" });
  }

  // Verify the order exists and belongs to this customer
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.customer_id, customerId)));

  if (!order) {
    return res.status(404).json({ message: "Commande introuvable" });
  }

  // Retrieve or create a payment record
  const [existingPayment] = await db
    .select()
    .from(payments)
    .where(eq(payments.order_id, orderId));

  if (existingPayment) {
    return res.json({ payment_url: existingPayment.payment_url });
  }

  const paymentUrl = `https://pay.wave.com/m/menupro/${orderId}`;
  const [newPayment] = await db
    .insert(payments)
    .values({
      order_id: orderId,
      payment_method: order.payment_method,
      amount: order.total,
      payment_status: "pending",
      payment_url: paymentUrl,
    })
    .returning();

  res.status(201).json({ payment_url: newPayment!.payment_url });
});

// ── GET /:orderId/status — Get payment and order status ──────────────────────

router.get("/:orderId/status", requireAuth, async (req, res) => {
  const customerId = req.customer!.id;
  const orderId = Number(req.params.orderId);

  if (Number.isNaN(orderId)) {
    return res.status(400).json({ message: "ID invalide" });
  }

  // Verify the order exists and belongs to this customer
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.customer_id, customerId)));

  if (!order) {
    return res.status(404).json({ message: "Commande introuvable" });
  }

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.order_id, orderId));

  if (!payment) {
    return res.status(404).json({ message: "Paiement introuvable" });
  }

  res.json({
    payment_status: payment.payment_status,
    order_status: order.status,
  });
});

export default router;

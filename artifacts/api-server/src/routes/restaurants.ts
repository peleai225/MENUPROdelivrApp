import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, restaurantsTable, menuCategoriesTable, dishesTable } from "@workspace/db";
import { eq, and, ilike } from "drizzle-orm";

const router: IRouter = Router();

// ─── Haversine ───────────────────────────────────────────────────────────────

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isPeakHour(): boolean {
  const h = new Date().getHours();
  return (h >= 12 && h < 14) || (h >= 18 && h < 20);
}

// ─── Validation ──────────────────────────────────────────────────────────────

const ListQuery = z.object({
  city: z.string().optional(),
  category: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  open_now: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
});

const NearbyQuery = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radius_km: z.coerce.number().default(10),
});

const DeliveryQuery = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
});

// ─── GET /restaurants ────────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  const parsed = ListQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid query parameters", errors: parsed.error.issues });
    return;
  }

  const { city, category, lat, lng, open_now } = parsed.data;

  // Build WHERE conditions
  const conditions = [];
  if (city) conditions.push(ilike(restaurantsTable.city, `%${city}%`));
  if (category) conditions.push(ilike(restaurantsTable.category, `%${category}%`));
  if (open_now) conditions.push(eq(restaurantsTable.is_open, true));

  const rows = await db
    .select()
    .from(restaurantsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Annotate with distance if coords provided
  const result =
    lat !== undefined && lng !== undefined
      ? rows.map((r) => ({
          ...r,
          distance_km: Math.round(
            haversineKm(lat, lng, Number(r.latitude), Number(r.longitude)) * 10,
          ) / 10,
        }))
      : rows;

  res.json(result);
});

// ─── GET /restaurants/nearby ─────────────────────────────────────────────────

router.get("/nearby", async (req, res) => {
  const parsed = NearbyQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "lat and lng are required", errors: parsed.error.issues });
    return;
  }

  const { lat, lng, radius_km } = parsed.data;

  const all = await db.select().from(restaurantsTable);

  const nearby = all
    .map((r) => ({
      ...r,
      distance_km:
        Math.round(
          haversineKm(lat, lng, Number(r.latitude), Number(r.longitude)) * 10,
        ) / 10,
    }))
    .filter((r) => r.distance_km <= radius_km)
    .sort((a, b) => a.distance_km - b.distance_km);

  res.json(nearby);
});

// ─── GET /restaurants/:id ────────────────────────────────────────────────────

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "Invalid restaurant id" });
    return;
  }

  const rows = await db
    .select()
    .from(restaurantsTable)
    .where(eq(restaurantsTable.id, id))
    .limit(1);

  if (rows.length === 0) {
    res.status(404).json({ message: "Restaurant not found" });
    return;
  }

  res.json(rows[0]);
});

// ─── GET /restaurants/:id/menu ───────────────────────────────────────────────

router.get("/:id/menu", async (req, res) => {
  const restaurantId = Number(req.params.id);
  if (Number.isNaN(restaurantId)) {
    res.status(400).json({ message: "Invalid restaurant id" });
    return;
  }

  // Verify restaurant exists
  const restaurant = await db
    .select({ id: restaurantsTable.id })
    .from(restaurantsTable)
    .where(eq(restaurantsTable.id, restaurantId))
    .limit(1);

  if (restaurant.length === 0) {
    res.status(404).json({ message: "Restaurant not found" });
    return;
  }

  // Fetch categories + dishes in one query
  const rows = await db
    .select({
      category: menuCategoriesTable,
      dish: dishesTable,
    })
    .from(menuCategoriesTable)
    .leftJoin(dishesTable, eq(dishesTable.category_id, menuCategoriesTable.id))
    .where(eq(menuCategoriesTable.restaurant_id, restaurantId));

  // Group dishes under their categories
  const categoryMap = new Map<
    number,
    { id: number; name: string; dishes: typeof dishesTable.$inferSelect[] }
  >();

  for (const { category, dish } of rows) {
    if (!categoryMap.has(category.id)) {
      categoryMap.set(category.id, { id: category.id, name: category.name, dishes: [] });
    }
    if (dish) {
      categoryMap.get(category.id)!.dishes.push(dish);
    }
  }

  res.json({
    restaurant_id: restaurantId,
    currency: "XOF",
    categories: Array.from(categoryMap.values()),
  });
});

// ─── GET /restaurants/:id/delivery-estimate ──────────────────────────────────

router.get("/:id/delivery-estimate", async (req, res) => {
  const restaurantId = Number(req.params.id);
  if (Number.isNaN(restaurantId)) {
    res.status(400).json({ message: "Invalid restaurant id" });
    return;
  }

  const parsed = DeliveryQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "lat and lng are required", errors: parsed.error.issues });
    return;
  }

  const { lat, lng } = parsed.data;

  const rows = await db
    .select()
    .from(restaurantsTable)
    .where(eq(restaurantsTable.id, restaurantId))
    .limit(1);

  if (rows.length === 0) {
    res.status(404).json({ message: "Restaurant not found" });
    return;
  }

  const restaurant = rows[0];
  const distance_km =
    Math.round(
      haversineKm(lat, lng, Number(restaurant.latitude), Number(restaurant.longitude)) * 10,
    ) / 10;

  // Fees in XOF centimes (1 XOF = 100 centimes here)
  const base_fee = 100_000;        // 1 000 FCFA
  const distance_fee = Math.round(distance_km * 50_000); // 500 FCFA/km
  const is_peak = isPeakHour();
  const peak_surcharge = is_peak ? 50_000 : 0; // 500 FCFA surcharge
  const delivery_fee = base_fee + distance_fee + peak_surcharge;

  const prep_minutes = restaurant.avg_prep_time;
  // Approximate transit: 3 min/km, minimum 5 min
  const transit_minutes = Math.max(5, Math.round(distance_km * 3));
  const estimated_minutes = prep_minutes + transit_minutes;

  res.json({
    deliverable: true,
    delivery_fee,
    distance_km,
    estimated_minutes,
    is_peak_hour: is_peak,
    breakdown: {
      base_fee,
      distance_fee,
      peak_surcharge,
      prep_minutes,
      transit_minutes,
    },
  });
});

export default router;

import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "pending_payment",
  "confirmed",
  "preparing",
  "ready",
  "delivering",
  "completed",
  "cancelled",
]);

// ─── customers ───────────────────────────────────────────────────────────────

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  password_hash: text("password_hash"),
  email: text("email"),
  city: text("city"),
  total_orders: integer("total_orders").default(0),
});

export const insertCustomerSchema = createInsertSchema(customersTable).omit({ id: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customersTable.$inferSelect;

// ─── auth_tokens ──────────────────────────────────────────────────────────────

export const authTokensTable = pgTable("auth_tokens", {
  id: serial("id").primaryKey(),
  customer_id: integer("customer_id")
    .notNull()
    .references(() => customersTable.id),
  token: text("token").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  expires_at: timestamp("expires_at").notNull(),
});

export const insertAuthTokenSchema = createInsertSchema(authTokensTable).omit({ id: true });
export type InsertAuthToken = z.infer<typeof insertAuthTokenSchema>;
export type AuthToken = typeof authTokensTable.$inferSelect;

// ─── restaurants ─────────────────────────────────────────────────────────────

export const restaurantsTable = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  logo_url: text("logo_url"),
  banner_url: text("banner_url"),
  is_open: boolean("is_open").notNull().default(false),
  min_order_amount: integer("min_order_amount").notNull().default(0),
  avg_prep_time: integer("avg_prep_time").notNull().default(0),
  delivery_fee: integer("delivery_fee").notNull().default(1000),
  latitude: numeric("latitude").notNull(),
  longitude: numeric("longitude").notNull(),
});

export const insertRestaurantSchema = createInsertSchema(restaurantsTable).omit({ id: true });
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurantsTable.$inferSelect;

// ─── menu_categories ──────────────────────────────────────────────────────────

export const menuCategoriesTable = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  restaurant_id: integer("restaurant_id")
    .notNull()
    .references(() => restaurantsTable.id),
});

export const insertMenuCategorySchema = createInsertSchema(menuCategoriesTable).omit({ id: true });
export type InsertMenuCategory = z.infer<typeof insertMenuCategorySchema>;
export type MenuCategory = typeof menuCategoriesTable.$inferSelect;

// ─── dishes ──────────────────────────────────────────────────────────────────

export const dishesTable = pgTable("dishes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // XOF centimes
  compare_price: integer("compare_price"),
  image_url: text("image_url"),
  is_available: boolean("is_available").notNull().default(true),
  is_featured: boolean("is_featured").notNull().default(false),
  is_spicy: boolean("is_spicy").notNull().default(false),
  is_vegetarian: boolean("is_vegetarian").notNull().default(false),
  prep_time: integer("prep_time").notNull().default(0),
  calories: integer("calories"),
  category_id: integer("category_id")
    .notNull()
    .references(() => menuCategoriesTable.id),
});

export const insertDishSchema = createInsertSchema(dishesTable).omit({ id: true });
export type InsertDish = z.infer<typeof insertDishSchema>;
export type Dish = typeof dishesTable.$inferSelect;

// ─── addresses ───────────────────────────────────────────────────────────────

export const addressesTable = pgTable("addresses", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  zone: text("zone"),
  latitude: numeric("latitude").notNull(),
  longitude: numeric("longitude").notNull(),
  instructions: text("instructions"),
  is_default: boolean("is_default").notNull().default(false),
  customer_id: integer("customer_id")
    .notNull()
    .references(() => customersTable.id),
});

export const insertAddressSchema = createInsertSchema(addressesTable).omit({ id: true });
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Address = typeof addressesTable.$inferSelect;

// ─── orders ──────────────────────────────────────────────────────────────────

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  tracking_token: text("tracking_token").notNull().unique(),
  status: orderStatusEnum("status").notNull().default("pending"),
  payment_method: text("payment_method").notNull(),
  subtotal: integer("subtotal").notNull(), // XOF centimes
  delivery_fee: integer("delivery_fee").notNull().default(0), // XOF centimes
  total: integer("total").notNull(), // XOF centimes
  estimated_minutes: integer("estimated_minutes").notNull().default(0),
  delivery_lat: numeric("delivery_lat").notNull().default("0"),
  delivery_lng: numeric("delivery_lng").notNull().default("0"),
  delivery_address: text("delivery_address").notNull().default(""),
  delivery_city: text("delivery_city").notNull().default(""),
  delivery_instructions: text("delivery_instructions"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  customer_id: integer("customer_id")
    .notNull()
    .references(() => customersTable.id),
  restaurant_id: integer("restaurant_id")
    .notNull()
    .references(() => restaurantsTable.id),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;

// ─── order_items ─────────────────────────────────────────────────────────────

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id")
    .notNull()
    .references(() => ordersTable.id),
  dish_id: integer("dish_id").references(() => dishesTable.id),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  unit_price: integer("unit_price").notNull(), // XOF centimes
  total: integer("total").notNull(), // XOF centimes
});

export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({ id: true });
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItemsTable.$inferSelect;

// ─── drivers ─────────────────────────────────────────────────────────────────

export const driversTable = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  current_lat: numeric("current_lat").notNull().default("0"),
  current_lng: numeric("current_lng").notNull().default("0"),
  rating: numeric("rating").notNull().default("0"),
});

export const insertDriverSchema = createInsertSchema(driversTable).omit({ id: true });
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof driversTable.$inferSelect;

// ─── deliveries ──────────────────────────────────────────────────────────────

export const deliveriesTable = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id")
    .notNull()
    .unique()
    .references(() => ordersTable.id),
  status: text("status").notNull(),
  status_label: text("status_label").notNull(),
  driver_id: integer("driver_id").references(() => driversTable.id),
});

export const insertDeliverySchema = createInsertSchema(deliveriesTable).omit({ id: true });
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveriesTable.$inferSelect;

// ─── order_timelines ──────────────────────────────────────────────────────────

export const orderTimelinesTable = pgTable("order_timelines", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id")
    .notNull()
    .unique()
    .references(() => ordersTable.id),
  ordered_at: timestamp("ordered_at"),
  confirmed_at: timestamp("confirmed_at"),
  preparing_at: timestamp("preparing_at"),
  ready_at: timestamp("ready_at"),
  driver_assigned_at: timestamp("driver_assigned_at"),
  picked_up_at: timestamp("picked_up_at"),
  completed_at: timestamp("completed_at"),
});

export const insertOrderTimelineSchema = createInsertSchema(orderTimelinesTable).omit({ id: true });
export type InsertOrderTimeline = z.infer<typeof insertOrderTimelineSchema>;
export type OrderTimeline = typeof orderTimelinesTable.$inferSelect;

// ─── payments ────────────────────────────────────────────────────────────────

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id")
    .notNull()
    .unique()
    .references(() => ordersTable.id),
  payment_url: text("payment_url").notNull(),
  payment_status: text("payment_status").notNull().default("pending"),
  payment_method: text("payment_method").notNull().default("wave"),
  amount: integer("amount").notNull().default(0), // XOF centimes
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;

// ─── Alias exports for backend routes (shorter names) ─────────────────────────
export const customers = customersTable;
export const authTokens = authTokensTable;
export const restaurants = restaurantsTable;
export const menuCategories = menuCategoriesTable;
export const dishes = dishesTable;
export const addresses = addressesTable;
export const orders = ordersTable;
export const orderItems = orderItemsTable;
export const drivers = driversTable;
export const deliveries = deliveriesTable;
export const orderTimelines = orderTimelinesTable;
export const payments = paymentsTable;

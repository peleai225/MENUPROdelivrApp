import { type Request, type Response, type NextFunction } from "express";
import { db, customersTable, authTokensTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// Augment the Express Request interface so req.customer is available
// throughout the app without casting.
declare global {
  namespace Express {
    interface Request {
      customer?: typeof customersTable.$inferSelect;
    }
  }
}

/**
 * Reads Authorization: Bearer <token>, looks it up in auth_tokens joined to
 * customers, and attaches the matching row to req.customer.
 * Does NOT reject unauthenticated requests — mount this globally then use
 * requireAuth on individual routes.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const rows = await db
      .select({ customer: customersTable })
      .from(authTokensTable)
      .innerJoin(
        customersTable,
        eq(authTokensTable.customer_id, customersTable.id),
      )
      .where(eq(authTokensTable.token, token))
      .limit(1);

    if (rows.length > 0) {
      req.customer = rows[0].customer;
    }
  }
  next();
}

/**
 * Rejects with 401 when no authenticated customer is present on the request.
 * Must be mounted after authenticate().
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.customer) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  next();
}

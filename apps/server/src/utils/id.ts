import { createId } from "@paralleldrive/cuid2";

/**
 * Generates IDs in the same shape Prisma's `@default(cuid())` would
 * produce, so records created outside `prisma migrate`/Client (see
 * db/pool.ts) stay consistent with the schema's intent.
 */
export function generateId(): string {
  return createId();
}

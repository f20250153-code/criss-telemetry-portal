/**
 * Roles supported by the telemetry portal.
 * Mirrors the `Role` enum defined in apps/server/prisma/schema.prisma.
 */
export type Role = "VIEWER" | "ENGINEER";

/**
 * Safe, public representation of a user.
 * This shape must NEVER include password or password hash fields.
 */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/db";
import type { User } from "@/db/schema";
import { SESSION_COOKIE, readSession } from "./auth";

/** The logged-in user, checked against the database (active + not logged out). */
export const currentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const s = await readSession(jar.get(SESSION_COOKIE)?.value);
  if (!s) return null;
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, s.u));
  if (!u || !u.active || u.sessionVersion !== s.v) return null;
  return u;
});

export type Need = "superadmin" | "owner";
export const ROLE_LABEL: Record<string, string> = { superadmin: "Super admin", admin: "Owner", rider: "Rider" };
/** Owner = the business owner ("admin"); PokitBio super admin can do everything an owner can. */
export const isOwner = (u: Pick<User, "role">) => u.role === "admin" || u.role === "superadmin";
const allowed = (u: User, need?: Need) => !need || (need === "superadmin" ? u.role === "superadmin" : isOwner(u));

/** For server actions: throws if not logged in or not allowed. */
export async function requireUser(need?: Need): Promise<User> {
  const u = await currentUser();
  if (!u) throw new Error("Please log in again");
  if (!allowed(u, need)) throw new Error(need === "superadmin" ? "Only PokitBio super admin can do this" : "Only the owner can do this");
  return u;
}

/** For pages: redirects to login, or home when the role isn't allowed. */
export async function pageUser(need?: Need): Promise<User> {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (!allowed(u, need)) redirect("/");
  return u;
}

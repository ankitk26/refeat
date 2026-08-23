import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export async function getCurrentProfileOrThrow(ctx: QueryCtx): Promise<Id<"profiles">> {
  const ident = await ctx.auth.getUserIdentity();
  if (!ident) throw new Error("Not authenticated");
  const authUserId = ident.subject;
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
    .first();
  if (!profile) throw new Error("Not authenticated: profile not found");
  return profile._id;
}

export async function getCurrentProfileIdSafe(ctx: QueryCtx): Promise<Id<"profiles"> | null> {
  const ident = await ctx.auth.getUserIdentity();
  if (!ident) return null;
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", ident.subject))
    .first();
  return profile?._id ?? null;
}

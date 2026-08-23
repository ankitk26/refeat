import { mutation, query } from "./_generated/server";
import { getCurrentProfileOrThrow } from "./model/profiles";

export const getMyProfile = query({
	args: {},
	handler: async (ctx) => {
		const profileId = await getCurrentProfileOrThrow(ctx);
		return await ctx.db.get(profileId);
	},
});

export const ensureMyProfile = mutation({
	args: {},
	handler: async (ctx) => {
		const ident = await ctx.auth.getUserIdentity();
		if (!ident) throw new Error("Not authenticated");
		const authUserId = ident.subject;
		const existing = await ctx.db
			.query("profiles")
			.withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
			.first();
		if (existing) return existing._id;

		// fallback to better-auth user email/name if available
		const email = (ident as any).email ?? (ident as any).emailAddress ?? "";
		const name = (ident as any).name ?? undefined;

		// Try to get more accurate data from better-auth via authComponent if needed
		// For now use identity fields
		const id = await ctx.db.insert("profiles", {
			authUserId,
			email: email || `user-${authUserId.slice(0, 8)}@example.com`,
			name,
			createdAt: Date.now(),
		});
		return id;
	},
});

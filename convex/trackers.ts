import { ConvexError, v } from "convex/values";
import { api } from "./_generated/api";
import { mutation } from "./_generated/server";

export const create = mutation({
	args: {
		name: v.string(),
		startTime: v.number(),
		clientSideTimezone: v.string(),
	},
	handler: async (ctx, args) => {
		const auth = await ctx.auth.getUserIdentity();
		if (!auth) {
			throw new ConvexError("Invalid request");
		}
		const user = await ctx.db
			.query("users")
			.withIndex("by_authId", (q) => q.eq("authId", auth.subject))
			.first();
		if (!user) {
			throw new ConvexError("Invalid request");
		}
		const insertedTrackerId = await ctx.db.insert("trackers", {
			creatorId: user._id,
			name: args.name,
			updatedTime: Date.now(),
			startTime: args.startTime,
		});
		await ctx.runMutation(api.trackerLogs.create, {
			trackerId: insertedTrackerId,
			clientSideTimezone: args.clientSideTimezone,
		});
	},
});

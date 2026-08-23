import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentProfileOrThrow } from "./model/profiles";

async function requireTrackerOwner(ctx: any, trackerId: any) {
	const profileId = await getCurrentProfileOrThrow(ctx);
	const tracker = await ctx.db.get(trackerId);
	if (!tracker) throw new Error("Tracker not found");
	if (tracker.profileId !== profileId) throw new Error("Forbidden: not owner");
	return { profileId, tracker };
}

export const listByTracker = query({
	args: { trackerId: v.id("trackers") },
	handler: async (ctx, args) => {
		await requireTrackerOwner(ctx, args.trackerId);
		return await ctx.db
			.query("completions")
			.withIndex("by_tracker", (q) => q.eq("trackerId", args.trackerId))
			.collect();
	},
});

export const getForDate = query({
	args: { trackerId: v.id("trackers"), date: v.string() },
	handler: async (ctx, args) => {
		await requireTrackerOwner(ctx, args.trackerId);
		return await ctx.db
			.query("completions")
			.withIndex("by_tracker_date", (q) =>
				q.eq("trackerId", args.trackerId).eq("date", args.date),
			)
			.unique();
	},
});

export const toggle = mutation({
	args: { trackerId: v.id("trackers"), date: v.string() },
	handler: async (ctx, args) => {
		await requireTrackerOwner(ctx, args.trackerId);
		const existing = await ctx.db
			.query("completions")
			.withIndex("by_tracker_date", (q) =>
				q.eq("trackerId", args.trackerId).eq("date", args.date),
			)
			.unique();

		if (existing) {
			await ctx.db.delete(existing._id);
			return null;
		}
		await ctx.db.insert("completions", {
			trackerId: args.trackerId,
			date: args.date,
			done: true,
			createdAt: Date.now(),
		});
		return true;
	},
});

export const setDone = mutation({
	args: { trackerId: v.id("trackers"), date: v.string(), done: v.boolean() },
	handler: async (ctx, args) => {
		await requireTrackerOwner(ctx, args.trackerId);
		const existing = await ctx.db
			.query("completions")
			.withIndex("by_tracker_date", (q) =>
				q.eq("trackerId", args.trackerId).eq("date", args.date),
			)
			.unique();
		if (args.done) {
			if (!existing) {
				await ctx.db.insert("completions", {
					trackerId: args.trackerId,
					date: args.date,
					done: true,
					createdAt: Date.now(),
				});
			} else if (!existing.done) {
				await ctx.db.patch(existing._id, { done: true });
			}
		} else {
			if (existing) await ctx.db.delete(existing._id);
		}
	},
});

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { getCurrentProfileOrThrow } from "./model/profiles";

async function requireTrackerOwner(
	ctx: QueryCtx | MutationCtx,
	trackerId: Id<"trackers">,
) {
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

/** All completions across the caller's trackers for one date. */
export const listForDate = query({
	args: { date: v.string() },
	handler: async (ctx, args) => {
		const profileId = await getCurrentProfileOrThrow(ctx);
		const ownedTrackers = await ctx.db
			.query("trackers")
			.withIndex("by_profile", (q) => q.eq("profileId", profileId))
			.collect();
		const completionsForDate = await Promise.all(
			ownedTrackers.map((tracker) =>
				ctx.db
					.query("completions")
					.withIndex("by_tracker_date", (q) =>
						q.eq("trackerId", tracker._id).eq("date", args.date),
					)
					.unique(),
			),
		);
		return completionsForDate.filter((completion) => completion !== null);
	},
});

/** Explicitly set a day's status from the day-status dialog. */
export const setStatus = mutation({
	args: {
		trackerId: v.id("trackers"),
		date: v.string(),
		status: v.union(
			v.literal("done"),
			v.literal("missed"),
			v.literal("pending"),
		),
	},
	handler: async (ctx, args) => {
		await requireTrackerOwner(ctx, args.trackerId);
		const existing = await ctx.db
			.query("completions")
			.withIndex("by_tracker_date", (q) =>
				q.eq("trackerId", args.trackerId).eq("date", args.date),
			)
			.unique();
		const row = {
			trackerId: args.trackerId,
			date: args.date,
			done: args.status === "done",
			status: args.status,
		};
		if (existing) {
			await ctx.db.patch(existing._id, row);
		} else {
			await ctx.db.insert("completions", { ...row, createdAt: Date.now() });
		}
		return args.status;
	},
});

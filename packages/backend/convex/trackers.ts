import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { getCurrentProfileOrThrow } from "./model/profiles";

async function requireProfile(ctx: QueryCtx | MutationCtx) {
	return await getCurrentProfileOrThrow(ctx);
}

async function requireTrackerOwner(
	ctx: QueryCtx | MutationCtx,
	trackerId: Id<"trackers">,
) {
	const profileId = await requireProfile(ctx);
	const tracker = await ctx.db.get(trackerId);
	if (!tracker) throw new Error("Tracker not found");
	if (tracker.profileId !== profileId) throw new Error("Forbidden: not owner");
	return { profileId, tracker };
}

export const list = query({
	args: {},
	handler: async (ctx) => {
		const profileId = await requireProfile(ctx);
		return await ctx.db
			.query("trackers")
			.withIndex("by_profile", (q) => q.eq("profileId", profileId))
			.order("desc")
			.collect();
	},
});

export const get = query({
	args: { id: v.id("trackers") },
	handler: async (ctx, args) => {
		const { tracker } = await requireTrackerOwner(ctx, args.id);
		return tracker;
	},
});

export const create = mutation({
	args: {
		title: v.string(),
		startDate: v.string(),
		targetDate: v.optional(v.string()),
		frequency: v.array(v.number()),
	},
	handler: async (ctx, args) => {
		const profileId = await requireProfile(ctx);
		if (!args.title.trim()) throw new Error("Title required");
		if (args.frequency.length === 0) throw new Error("Frequency required");
		const id = await ctx.db.insert("trackers", {
			title: args.title.trim(),
			startDate: args.startDate,
			targetDate: args.targetDate,
			frequency: args.frequency,
			profileId,
			createdAt: Date.now(),
		});
		return id;
	},
});

/** Mutable tracker fields; mirrors the `trackers` table in schema.ts. */
type TrackerPatch = {
	title?: string;
	startDate?: string;
	targetDate?: string;
	frequency?: number[];
};

export const update = mutation({
	args: {
		id: v.id("trackers"),
		title: v.optional(v.string()),
		startDate: v.optional(v.string()),
		targetDate: v.optional(v.string()),
		frequency: v.optional(v.array(v.number())),
	},
	handler: async (ctx, args) => {
		const { tracker } = await requireTrackerOwner(ctx, args.id);
		const patch: TrackerPatch = {};
		if (args.title !== undefined) {
			if (!args.title.trim()) throw new Error("Title required");
			patch.title = args.title.trim();
		}
		if (args.startDate !== undefined) patch.startDate = args.startDate;
		if (args.targetDate !== undefined) patch.targetDate = args.targetDate;
		if (args.frequency !== undefined) {
			if (args.frequency.length === 0) throw new Error("Frequency required");
			patch.frequency = args.frequency;
		}
		await ctx.db.patch(tracker._id, patch);
		return tracker._id;
	},
});

export const remove = mutation({
	args: { id: v.id("trackers") },
	handler: async (ctx, args) => {
		const { tracker } = await requireTrackerOwner(ctx, args.id);
		const comps = await ctx.db
			.query("completions")
			.withIndex("by_tracker", (q) => q.eq("trackerId", tracker._id))
			.collect();
		for (const c of comps) await ctx.db.delete(c._id);
		await ctx.db.delete(tracker._id);
		return null;
	},
});

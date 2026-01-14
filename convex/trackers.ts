import { ConvexError, v } from "convex/values";
import { api, internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";

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
			clientSideTimezone: args.clientSideTimezone,
		});
		await ctx.runMutation(internal.trackerLogs.create, {
			trackerId: insertedTrackerId,
			clientSideTimezone: args.clientSideTimezone,
		});
	},
});

export const list = query({
	handler: async (ctx) => {
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

		const trackers = await ctx.db
			.query("trackers")
			.withIndex("by_creator", (q) => q.eq("creatorId", user._id))
			.order("desc")
			.collect();

		return trackers;
	},
});

export const getById = query({
	args: {
		trackerId: v.id("trackers"),
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

		const tracker = await ctx.db.get(args.trackerId);
		if (!tracker) {
			throw new ConvexError("Invalid request");
		}

		if (tracker.creatorId !== user._id) {
			throw new ConvexError("Invalid request");
		}

		return tracker;
	},
});

export const deleteById = mutation({
	args: {
		trackerId: v.id("trackers"),
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

		const tracker = await ctx.db.get(args.trackerId);
		if (!tracker) {
			throw new ConvexError("Invalid request");
		}

		if (tracker.creatorId !== user._id) {
			throw new ConvexError("Invalid request");
		}

		await ctx.db.delete(args.trackerId);
	},
});

export const update = mutation({
	args: { trackerId: v.id("trackers"), updatedName: v.string() },
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

		const tracker = await ctx.db.get(args.trackerId);
		if (!tracker) {
			throw new ConvexError("Invalid request");
		}

		if (tracker.creatorId !== user._id) {
			throw new ConvexError("Invalid request");
		}

		await ctx.db.patch(args.trackerId, {
			name: args.updatedName,
			updatedTime: Date.now(),
		});
	},
});

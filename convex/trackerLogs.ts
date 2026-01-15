import { ConvexError, v } from "convex/values";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { internalMutation, query } from "./_generated/server";

export const create = internalMutation({
	args: {
		trackerId: v.id("trackers"),
		clientSideTimezone: v.string(),
	},
	handler: async (ctx, args) => {
		const auth = await ctx.auth.getUserIdentity();
		if (!auth) {
			throw new ConvexError("Invalid request");
		}

		const tracker = await ctx.db.get(args.trackerId);
		if (!tracker) {
			throw new ConvexError("Invalid request");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_authId", (q) => q.eq("authId", auth.subject))
			.first();
		if (!user) {
			throw new ConvexError("Invalid request");
		}

		if (tracker.creatorId !== user._id) {
			throw new ConvexError("Invalid request");
		}

		const clientSideTimezone = args.clientSideTimezone;

		// Convert start time to user's local date and get start of that day
		const startInUserTz = toZonedTime(
			new Date(tracker.startTime),
			clientSideTimezone
		);
		const startUserDay = new Date(
			startInUserTz.getFullYear(),
			startInUserTz.getMonth(),
			startInUserTz.getDate()
		);

		// Convert server now to user's local date and get start of that day
		const nowInUserTz = toZonedTime(new Date(), clientSideTimezone);
		const endUserDay = new Date(
			nowInUserTz.getFullYear(),
			nowInUserTz.getMonth(),
			nowInUserTz.getDate()
		);

		// Iterate over user's local days
		for (
			let cursor = new Date(startUserDay);
			cursor.getTime() <= endUserDay.getTime();
			cursor.setDate(cursor.getDate() + 1)
		) {
			// Convert this local midnight to UTC epoch
			const localMidnightUtc = fromZonedTime(cursor, clientSideTimezone);

			await ctx.db.insert("trackerLogs", {
				trackerId: args.trackerId,
				logTimeEpoch: localMidnightUtc.getTime(), // UTC epoch of user's local midnight
				clientSideTimezone: clientSideTimezone,
				userDay: cursor.getDate(), // day from user's perspective
				userMonth: cursor.getMonth() + 1, // month from user's perspective
				userYear: cursor.getFullYear(), // year from user's perspective
				isAccomplished: false,
			});
		}
	},
});

export const listByMonth = query({
	args: {
		range: v.union(v.literal("month"), v.literal("year")),
		month: v.number(),
		year: v.number(),
		trackerId: v.id("trackers"),
	},
	handler: async (ctx, args) => {
		const auth = await ctx.auth.getUserIdentity();
		if (!auth) {
			throw new ConvexError("Invalid request");
		}

		const tracker = await ctx.db.get(args.trackerId);
		if (!tracker) {
			throw new ConvexError("Invalid request");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_authId", (q) => q.eq("authId", auth.subject))
			.first();
		if (!user) {
			throw new ConvexError("Invalid request");
		}

		if (tracker.creatorId !== user._id) {
			throw new ConvexError("Invalid request");
		}

		if (args.range === "month") {
			const logs = await ctx.db
				.query("trackerLogs")
				.withIndex("by_tracker_month_year", (q) =>
					q
						.eq("trackerId", args.trackerId)
						.eq("userMonth", args.month)
						.eq("userYear", args.year)
				)
				.collect();
			return logs;
		}

		const logs = await ctx.db
			.query("trackerLogs")
			.withIndex("by_tracker_year", (q) =>
				q.eq("trackerId", args.trackerId).eq("userYear", args.year)
			)
			.collect();

		return logs;
	},
});

export const listByTracker = query({
	args: {
		trackerId: v.id("trackers"),
	},
	handler: async (ctx, args) => {
		const auth = await ctx.auth.getUserIdentity();
		if (!auth) {
			throw new ConvexError("Invalid request");
		}

		const tracker = await ctx.db.get(args.trackerId);
		if (!tracker) {
			throw new ConvexError("Invalid request");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_authId", (q) => q.eq("authId", auth.subject))
			.first();
		if (!user) {
			throw new ConvexError("Invalid request");
		}

		if (tracker.creatorId !== user._id) {
			throw new ConvexError("Invalid request");
		}

		const logs = await ctx.db
			.query("trackerLogs")
			.withIndex("by_tracker", (q) => q.eq("trackerId", args.trackerId))
			.collect();

		return logs;
	},
});

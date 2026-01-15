import { ConvexError, v } from "convex/values";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { internalMutation, mutation, query } from "./_generated/server";

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

export const updateStatus = mutation({
	args: {
		trackerId: v.id("trackers"),
		isAccomplished: v.boolean(),
		userCurrentDate: v.object({
			day: v.number(),
			month: v.number(),
			year: v.number(),
		}),
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

		const user = await ctx.db.get(tracker.creatorId);
		if (!user) {
			throw new ConvexError("Invalid request");
		}

		if (user.authId !== auth.subject) {
			throw new ConvexError("Invalid request");
		}

		// Find log by month/year, then filter by day
		const logsInMonth = await ctx.db
			.query("trackerLogs")
			.withIndex("by_tracker_month_year", (q) =>
				q
					.eq("trackerId", args.trackerId)
					.eq("userMonth", args.userCurrentDate.month)
					.eq("userYear", args.userCurrentDate.year)
			)
			.collect();

		const log = logsInMonth.find((l) => l.userDay === args.userCurrentDate.day);

		if (!log) {
			throw new ConvexError("Log not found for today");
		}

		await ctx.db.patch(log._id, {
			isAccomplished: args.isAccomplished,
		});
	},
});

// Backfill missing logs from last log date to today
export const backfillLogs = mutation({
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

		// Get all logs for this tracker, sorted by logTimeEpoch descending
		const existingLogs = await ctx.db
			.query("trackerLogs")
			.withIndex("by_tracker", (q) => q.eq("trackerId", args.trackerId))
			.collect();

		// Get today in user's timezone
		const nowInUserTz = toZonedTime(new Date(), clientSideTimezone);
		const todayUserDay = new Date(
			nowInUserTz.getFullYear(),
			nowInUserTz.getMonth(),
			nowInUserTz.getDate()
		);

		let startFromDate: Date;

		if (existingLogs.length === 0) {
			// No logs exist, start from tracker's start time
			const startInUserTz = toZonedTime(
				new Date(tracker.startTime),
				clientSideTimezone
			);
			startFromDate = new Date(
				startInUserTz.getFullYear(),
				startInUserTz.getMonth(),
				startInUserTz.getDate()
			);
		} else {
			// Find the latest log by logTimeEpoch
			const latestLog = existingLogs.reduce((latest, log) =>
				log.logTimeEpoch > latest.logTimeEpoch ? log : latest
			);

			// Start from the day after the latest log
			const latestLogDate = new Date(
				latestLog.userYear,
				latestLog.userMonth - 1,
				latestLog.userDay
			);
			startFromDate = new Date(latestLogDate);
			startFromDate.setDate(startFromDate.getDate() + 1);
		}

		// Create logs from startFromDate to today
		const logsToCreate: Array<{
			trackerId: typeof args.trackerId;
			logTimeEpoch: number;
			clientSideTimezone: string;
			userDay: number;
			userMonth: number;
			userYear: number;
			isAccomplished: boolean;
		}> = [];

		for (
			let cursor = new Date(startFromDate);
			cursor.getTime() <= todayUserDay.getTime();
			cursor.setDate(cursor.getDate() + 1)
		) {
			const localMidnightUtc = fromZonedTime(cursor, clientSideTimezone);

			logsToCreate.push({
				trackerId: args.trackerId,
				logTimeEpoch: localMidnightUtc.getTime(),
				clientSideTimezone: clientSideTimezone,
				userDay: cursor.getDate(),
				userMonth: cursor.getMonth() + 1,
				userYear: cursor.getFullYear(),
				isAccomplished: false,
			});
		}

		// Insert all new logs
		for (const log of logsToCreate) {
			await ctx.db.insert("trackerLogs", log);
		}

		return { created: logsToCreate.length };
	},
});

export const deleteByTracker = internalMutation({
	args: {
		trackerId: v.id("trackers"),
	},
	handler: async (ctx, args) => {
		const trackerLogs = await ctx.db
			.query("trackerLogs")
			.withIndex("by_tracker", (q) => q.eq("trackerId", args.trackerId))
			.collect();
		await Promise.all(trackerLogs.map((log) => ctx.db.delete(log._id)));
	},
});

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	users: defineTable({
		authId: v.string(),
		name: v.string(),
		email: v.string(),
		image: v.optional(v.nullable(v.string())),
	}).index("by_authId", ["authId"]),

	trackers: defineTable({
		name: v.string(),
		description: v.optional(v.string()),
		updatedTime: v.number(),
		creatorId: v.id("users"),
		startTime: v.number(),
		clientSideTimezone: v.string(),
	}).index("by_creator", ["creatorId"]),

	trackerLogs: defineTable({
		trackerId: v.id("trackers"),
		logTimeEpoch: v.number(),
		clientSideTimezone: v.string(),
		isAccomplished: v.boolean(),
		userDay: v.number(),
		userMonth: v.number(),
		userYear: v.number(),
	})
		.index("by_tracker", ["trackerId"])
		.index("by_logTime_timezone", ["logTimeEpoch", "clientSideTimezone"])
		.index("by_tracker_month_year", ["trackerId", "userMonth", "userYear"])
		.index("by_tracker_year", ["trackerId", "userYear"]),
});

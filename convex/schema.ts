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
	}).index("by_creator", ["creatorId"]),

	trackerLogs: defineTable({
		day: v.number(),
		month: v.number(),
		year: v.number(),
		logTime: v.number(),
		trackerId: v.id("trackers"),
		isAccomplished: v.boolean(),
	})
		.index("by_tracker", ["trackerId"])
		.index("by_days", ["day", "month", "year"]),
});

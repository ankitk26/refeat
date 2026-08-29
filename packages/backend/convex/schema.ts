import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	profiles: defineTable({
		authUserId: v.string(),
		email: v.string(),
		name: v.optional(v.string()),
		createdAt: v.number(),
	}).index("by_authUserId", ["authUserId"]),

	trackers: defineTable({
		title: v.string(),
		startDate: v.string(), // YYYY-MM-DD
		targetDate: v.optional(v.string()),
		frequency: v.array(v.number()), // 0=Sun .. 6=Sat
		profileId: v.id("profiles"),
		createdAt: v.number(),
	}).index("by_profile", ["profileId"]),

	completions: defineTable({
		trackerId: v.id("trackers"),
		date: v.string(), // YYYY-MM-DD
		done: v.boolean(),
		// explicit user-set status; legacy rows may only have `done`
		status: v.optional(
			v.union(v.literal("done"), v.literal("missed"), v.literal("pending")),
		),
		createdAt: v.number(),
	})
		.index("by_tracker", ["trackerId"])
		.index("by_tracker_date", ["trackerId", "date"]),
});

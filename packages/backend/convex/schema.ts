import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  trackers: defineTable({
    title: v.string(),
    startDate: v.string(), // YYYY-MM-DD
    targetDate: v.optional(v.string()),
    frequency: v.array(v.number()), // 0=Sun .. 6=Sat
    userId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  completions: defineTable({
    trackerId: v.id("trackers"),
    date: v.string(), // YYYY-MM-DD
    done: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_tracker", ["trackerId"])
    .index("by_tracker_date", ["trackerId", "date"]),
});

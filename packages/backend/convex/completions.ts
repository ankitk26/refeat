import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByTracker = query({
  args: { trackerId: v.id("trackers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("completions")
      .withIndex("by_tracker", (q) => q.eq("trackerId", args.trackerId))
      .collect();
  },
});

export const getForDate = query({
  args: { trackerId: v.id("trackers"), date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("completions")
      .withIndex("by_tracker_date", (q) => q.eq("trackerId", args.trackerId).eq("date", args.date))
      .unique();
  },
});

export const toggle = mutation({
  args: { trackerId: v.id("trackers"), date: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("completions")
      .withIndex("by_tracker_date", (q) => q.eq("trackerId", args.trackerId).eq("date", args.date))
      .unique();

    if (existing) {
      // toggle done -> if was done, remove (means undo), else set done
      // For simplicity, delete to mean not done, or if we store done boolean, toggle
      // We'll delete to indicate not done, so failed state will be inferred
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
    const existing = await ctx.db
      .query("completions")
      .withIndex("by_tracker_date", (q) => q.eq("trackerId", args.trackerId).eq("date", args.date))
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

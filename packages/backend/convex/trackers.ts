import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    // if authed, filter by userId; otherwise return all (for dev)
    if (user) {
      const own = await ctx.db
        .query("trackers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .collect();
      // also include anon? no
      return own;
    }
    return await ctx.db.query("trackers").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("trackers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
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
    const user = await authComponent.safeGetAuthUser(ctx);
    const id = await ctx.db.insert("trackers", {
      title: args.title.trim(),
      startDate: args.startDate,
      targetDate: args.targetDate,
      frequency: args.frequency,
      userId: user?._id,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("trackers"),
    title: v.optional(v.string()),
    startDate: v.optional(v.string()),
    targetDate: v.optional(v.string()),
    frequency: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    const patch: Record<string, unknown> = {};
    if (rest.title !== undefined) patch.title = rest.title.trim();
    if (rest.startDate !== undefined) patch.startDate = rest.startDate;
    if (rest.targetDate !== undefined) patch.targetDate = rest.targetDate;
    if (rest.frequency !== undefined) patch.frequency = rest.frequency;
    await ctx.db.patch(id, patch);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("trackers") },
  handler: async (ctx, args) => {
    // delete completions first
    const comps = await ctx.db
      .query("completions")
      .withIndex("by_tracker", (q) => q.eq("trackerId", args.id))
      .collect();
    for (const c of comps) await ctx.db.delete(c._id);
    await ctx.db.delete(args.id);
  },
});

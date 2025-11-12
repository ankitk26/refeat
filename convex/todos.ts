import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("todos").collect();
  },
});

export const add = mutation({
  args: { description: v.string() },
  handler: async (ctx, { description }) => {
    return await ctx.db.insert("todos", { description });
  },
});

import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import type { AuthFunctions } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";

import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;

const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  triggers: {
    user: {
      onCreate: async (ctx, doc) => {
        await ctx.db.insert("profiles", {
          authUserId: doc._id,
          email: doc.email,
          name: (doc as any).name ?? undefined,
          createdAt: Date.now(),
        });
      },
      onUpdate: async (ctx, newDoc) => {
        if (!newDoc) return;
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_authUserId", (q) => q.eq("authUserId", newDoc._id))
          .first();
        if (!profile) return;
        await ctx.db.patch(profile._id, {
          email: newDoc.email,
          name: (newDoc as any).name ?? profile.name,
        });
      },
      onDelete: async (ctx, doc) => {
        if (!doc) return;
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_authUserId", (q) => q.eq("authUserId", doc._id))
          .first();
        if (!profile) return;
        await ctx.db.delete(profile._id);
      },
    },
  },
});

function createAuth(ctx: GenericCtx<DataModel>) {
  return betterAuth({
    baseURL: siteUrl,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      convex({
        authConfig,
        jwksRotateOnTokenGenerationError: true,
      }),
    ],
  });
}

export { createAuth };

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.safeGetAuthUser(ctx);
  },
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import type { AuthFunctions } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;

/** Read a required env var, failing loudly at cold start instead of passing `undefined` along. */
function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`Missing required environment variable: ${name}`);
	return value;
}

const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
	authFunctions,
	triggers: {
		user: {
			onCreate: async (ctx, doc) => {
				await ctx.db.insert("profiles", {
					authUserId: doc._id,
					email: doc.email,
					name: doc.name,
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
					name: newDoc.name ?? profile.name,
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
			enabled: false,
		},
		socialProviders: {
			google: {
				clientId: requireEnv("GOOGLE_CLIENT_ID"),
				clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
				accessType: "offline",
				prompt: "select_account",
			},
		},
		session: {
			cookieCache: { enabled: true, maxAge: 5 * 60 },
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24,
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

import {
	createClient,
	type AuthFunctions,
	type GenericCtx,
} from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import type { DataModel } from "./_generated/dataModel";
import { components, internal } from "./_generated/api";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;

const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
	authFunctions,
	triggers: {
		user: {
			onCreate: async (ctx, doc) => {
				await ctx.db.insert("users", {
					authId: doc._id,
					email: doc.email,
					name: doc.name,
					image: doc.image,
				});
			},
			onUpdate: async (ctx, newDoc) => {
				const authId = newDoc._id;
				const user = await ctx.db
					.query("users")
					.withIndex("by_authId", (q) => q.eq("authId", authId))
					.first();
				if (!user) {
					return;
				}
				await ctx.db.patch(user._id, {
					name: newDoc.name,
					email: newDoc.email,
				});
			},
		},
	},
});

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	return betterAuth({
		baseURL: siteUrl,
		database: authComponent.adapter(ctx),
		// Configure simple, non-verified email/password to get started
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		plugins: [
			// The Convex plugin is required for Convex compatibility
			convex({ authConfig }),
		],
	});
};

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		return await authComponent.getAuthUser(ctx);
	},
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

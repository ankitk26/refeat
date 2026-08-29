import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { Toaster } from "@refeat/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
	useRouteContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";
import { authClient } from "@/lib/auth-client";
import { getToken } from "@/lib/auth-server";
import appCss from "../index.css?url";

const getAuth = createServerFn({ method: "GET" }).handler(async () => {
	return await getToken();
});

export interface RouterAppContext {
	queryClient: QueryClient;
	convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "refeat — Where calm meets consistency" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Jersey+10&family=Silkscreen:wght@400;700&display=swap",
			},
		],
	}),

	component: RootDocument,
	beforeLoad: async (ctx) => {
		const token = await getAuth();
		if (token) {
			ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
		}
		return {
			isAuthenticated: !!token,
			token,
		};
	},
});

function RootDocument() {
	const context = useRouteContext({ from: Route.id });
	return (
		<ConvexBetterAuthProvider
			client={context.convexQueryClient.convexClient}
			authClient={authClient}
			initialToken={context.token}
		>
			<html lang="en">
				<head>
					<HeadContent />
					{/* restore theme before first paint to avoid a light-mode flash */}
					<script
						dangerouslySetInnerHTML={{
							__html: `(function(){try{var stored=localStorage.getItem("refeat-theme");var prefersDark=window.matchMedia("(prefers-color-scheme: dark)").matches;var isDark=stored?stored==="dark":prefersDark;document.documentElement.classList.toggle("dark",isDark);}catch(e){}})();`,
						}}
					/>
				</head>
				<body className="min-h-svh antialiased">
					<Outlet />
					<Toaster richColors />
					<TanStackRouterDevtools position="bottom-left" />
					<Scripts />
				</body>
			</html>
		</ConvexBetterAuthProvider>
	);
}

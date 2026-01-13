import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
	component: RouteComponent,
	beforeLoad: ({ context }) => {
		const isAuthenticated = context.isAuthenticated;
		if (!isAuthenticated) {
			throw redirect({ to: "/login" });
		}
	},
});

function RouteComponent() {
	return <Outlet />;
}

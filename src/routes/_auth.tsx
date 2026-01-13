import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import Header from "@/components/header";

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
	return (
		<div className="w-3/5 space-y-12 mx-auto">
			<Header />
			<Outlet />
		</div>
	);
}

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
		<div className="w-full px-4 sm:px-6 lg:w-3/5 lg:px-0 space-y-12 mb-12 mx-auto">
			<Header />
			<Outlet />
		</div>
	);
}

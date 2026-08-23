import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/trackers/")({
	beforeLoad: () => {
		throw redirect({ to: "/" });
	},
});

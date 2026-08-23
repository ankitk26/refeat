import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/trackers/$id")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/trackers/$id"!</div>;
}

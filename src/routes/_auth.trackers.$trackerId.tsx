import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import TrackerLogsByMonth from "@/components/tracker-logs-by-month";
import { epochToDate } from "@/lib/epoch-to-date";

export const Route = createFileRoute("/_auth/trackers/$trackerId")({
	component: RouteComponent,
	loader: (ctx) => {
		const { trackerId } = ctx.params;
		ctx.context.queryClient.ensureQueryData(
			convexQuery(api.trackers.getById, {
				trackerId: trackerId as Id<"trackers">,
			})
		);
	},
});

function RouteComponent() {
	const { trackerId } = Route.useParams();

	const { data: tracker } = useSuspenseQuery(
		convexQuery(api.trackers.getById, {
			trackerId: trackerId as Id<"trackers">,
		})
	);

	return (
		<div className="space-y-8 pb-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">
					{tracker.name}
				</h1>
				<p className="text-muted-foreground text-sm">
					Started on{" "}
					{epochToDate(tracker.startTime, tracker.clientSideTimezone || "UTC")}
				</p>
			</div>
			<TrackerLogsByMonth />
		</div>
	);
}

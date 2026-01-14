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
		<div>
			<h1 className="text-xl font-semibold">{tracker.name}</h1>
			<h6 className="text-neutral-400 text-xs">
				Started on {epochToDate(tracker.startTime, tracker.clientSideTimezone)}
			</h6>
			<TrackerLogsByMonth />
		</div>
	);
}

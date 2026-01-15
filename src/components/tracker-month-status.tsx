import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import LogStatusByDay from "./log-status-by-day";
import { Skeleton } from "./ui/skeleton";

type Props = {
	trackerId: Id<"trackers">;
};

export default function TrackerMonthStatus(props: Props) {
	const { data: logs, isPending } = useQuery(
		convexQuery(api.trackerLogs.listByMonth, {
			range: "month",
			trackerId: props.trackerId,
			month: new Date().getMonth() + 1,
			year: new Date().getFullYear(),
		})
	);

	if (isPending) {
		return (
			<div className="flex items-center flex-wrap gap-1.5">
				{[...Array(7)].map((_, i) => (
					<Skeleton key={i} className="h-6 w-6 rounded-full" />
				))}
			</div>
		);
	}

	return (
		<div className="flex items-center flex-wrap gap-1.5">
			<LogStatusByDay logs={logs ?? []} />
		</div>
	);
}

import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { groupLogsByYearAndMonth } from "@/lib/group-logs-by-year-month";
import LogStatusByDay from "./log-status-by-day";

export default function TrackerLogsByMonth() {
	const { trackerId } = useParams({ from: "/_auth/trackers/$trackerId" });
	const { data: logs, isPending } = useQuery(
		convexQuery(api.trackerLogs.listByTracker, {
			trackerId: trackerId as Id<"trackers">,
		})
	);

	if (isPending || !logs) {
		return <p>Loading...</p>;
	}

	const sortedLogsGroupedByYearMonth = groupLogsByYearAndMonth(logs);

	return (
		<div>
			{sortedLogsGroupedByYearMonth.map((yearlyLogs) => (
				<div>
					<h1>{yearlyLogs.year}</h1>
					{yearlyLogs.months.map((monthlyLogs) => (
						<div>
							<h1>Month #{monthlyLogs.month}</h1>
							<div className="flex items-center flex-wrap gap-1.5">
								<LogStatusByDay logs={monthlyLogs.logs} />
							</div>
						</div>
					))}
				</div>
			))}
		</div>
	);
}

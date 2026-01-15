import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { groupLogsByYearAndMonth } from "@/lib/group-logs-by-year-month";
import LogStatusByDay from "./log-status-by-day";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

const MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

export default function TrackerLogsByMonth() {
	const { trackerId } = useParams({ from: "/_auth/trackers/$trackerId" });
	const { data: logs, isPending } = useQuery(
		convexQuery(api.trackerLogs.listByTracker, {
			trackerId: trackerId as Id<"trackers">,
		})
	);

	if (isPending || !logs) {
		return (
			<div className="space-y-8 mt-8">
				<div className="space-y-4">
					<Skeleton className="h-6 w-16" />
					<Card size="sm">
						<CardHeader>
							<Skeleton className="h-5 w-32" />
						</CardHeader>
						<CardContent>
							<div className="flex items-center flex-wrap gap-1.5">
								{[...Array(10)].map((_, i) => (
									<Skeleton key={i} className="h-6 w-6 rounded-full" />
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	if (logs.length === 0) {
		return (
			<Card>
				<CardContent className="py-8 text-center">
					<p className="text-muted-foreground text-sm">
						No logs yet. Start tracking to see your progress!
					</p>
				</CardContent>
			</Card>
		);
	}

	const sortedLogsGroupedByYearMonth = groupLogsByYearAndMonth(logs);

	return (
		<div className="space-y-8 mt-8">
			{sortedLogsGroupedByYearMonth.map((yearlyLogs) => (
				<div key={yearlyLogs.year} className="space-y-4">
					<h2 className="text-lg font-semibold text-foreground/80">
						{yearlyLogs.year}
					</h2>
					<div className="space-y-3">
						{yearlyLogs.months.map((monthlyLogs) => {
							const accomplishedCount = monthlyLogs.logs.filter(
								(log) => log.isAccomplished
							).length;
							const totalDays = monthlyLogs.logs.length;
							const percentage = Math.round(
								(accomplishedCount / totalDays) * 100
							);

							return (
								<Card key={monthlyLogs.month} size="sm">
									<CardHeader>
										<div className="flex items-center justify-between">
											<CardTitle className="text-sm font-medium">
												{MONTH_NAMES[monthlyLogs.month - 1]}
											</CardTitle>
											<span className="text-xs text-muted-foreground font-medium">
												{accomplishedCount}/{totalDays} ({percentage}%)
											</span>
										</div>
									</CardHeader>
									<CardContent>
										<div className="flex items-center flex-wrap gap-1.5">
											<LogStatusByDay logs={monthlyLogs.logs} />
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</div>
			))}
		</div>
	);
}

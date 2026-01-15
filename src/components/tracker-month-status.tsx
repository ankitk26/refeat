import { convexQuery } from "@convex-dev/react-query";
import { IconCircleFilled } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import LogStatusByDay from "./log-status-by-day";

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
		return <p>loading logs...</p>;
	}

	return (
		<div className="flex items-center flex-wrap gap-1.5">
			<LogStatusByDay logs={logs ?? []} />
		</div>
	);
}

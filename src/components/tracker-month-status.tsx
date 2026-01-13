import { convexQuery } from "@convex-dev/react-query";
import { IconCircleFilled } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type Props = {
	trackerId: Id<"trackers">;
};

export default function TrackerMonthStatus(props: Props) {
	const { data, isPending } = useQuery(
		convexQuery(api.trackerLogs.list, {
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
		<div>
			{data?.map((log) => (
				<IconCircleFilled
					key={log._id}
					className={cn(
						"size-2.5",
						log.isAccomplished ? "text-emerald-600" : "text-rose-600"
					)}
				/>
			))}
		</div>
	);
}

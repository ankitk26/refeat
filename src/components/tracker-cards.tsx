import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import TrackerMonthStatus from "./tracker-month-status";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

export default function TrackerCards() {
	const { data, isPending } = useQuery(convexQuery(api.trackers.list));

	if (isPending) {
		return <p>loading trackers..</p>;
	}

	return (
		<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
			{data?.map((tracker) => (
				<Card key={tracker._id} className="col-span-1 w-full">
					<CardHeader>
						<CardTitle>{tracker.name}</CardTitle>
						<CardDescription>
							Started on{" "}
							{new Intl.DateTimeFormat("en", {
								dateStyle: "medium", // "Jan 14, 2025"
								timeZone: tracker.clientSideTimezone,
							}).format(tracker.startTime)}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<TrackerMonthStatus trackerId={tracker._id} />
					</CardContent>
				</Card>
			))}
		</div>
	);
}

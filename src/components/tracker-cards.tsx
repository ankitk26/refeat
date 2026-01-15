import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import TrackerCardItem from "./tracker-card-item";
import { Skeleton } from "./ui/skeleton";

export default function TrackerCards() {
	const { data, isPending } = useQuery(convexQuery(api.trackers.list));

	if (isPending) {
		return (
			<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
				{[...Array(3)].map((_, i) => (
					<div key={i} className="space-y-4">
						<Skeleton className="h-6 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
						<Skeleton className="h-20 w-full" />
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
			{data?.map((tracker) => (
				<TrackerCardItem key={tracker._id} tracker={tracker} />
			))}
		</div>
	);
}

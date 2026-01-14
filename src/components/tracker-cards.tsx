import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import TrackerCardItem from "./tracker-card-item";

export default function TrackerCards() {
	const { data, isPending } = useQuery(convexQuery(api.trackers.list));

	if (isPending) {
		return <p>loading trackers..</p>;
	}

	return (
		<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
			{data?.map((tracker) => (
				<TrackerCardItem key={tracker._id} tracker={tracker} />
			))}
		</div>
	);
}

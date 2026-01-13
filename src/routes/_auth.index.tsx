import { createFileRoute } from "@tanstack/react-router";
import TrackerCards from "@/components/tracker-cards";

export const Route = createFileRoute("/_auth/")({ component: App });

function App() {
	return (
		<div>
			<TrackerCards />
		</div>
	);
}

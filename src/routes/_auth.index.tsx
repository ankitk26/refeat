import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/")({ component: App });

function App() {
	return (
		<div>
			<h1>e</h1>
		</div>
	);
}

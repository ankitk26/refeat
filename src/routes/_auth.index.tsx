import { createFileRoute } from "@tanstack/react-router";
import { ComponentExample } from "@/components/component-example";

export const Route = createFileRoute("/_auth/")({ component: App });

function App() {
	return <ComponentExample />;
}

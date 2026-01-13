import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-col h-dvh w-full items-center justify-center">
			<h1>Track your goals</h1>
			<Button
				type="button"
				onClick={() => {
					authClient.signIn.social({ provider: "google" });
				}}
			>
				Log in with Google
			</Button>
		</div>
	);
}

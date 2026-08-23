import { Button } from "@refeat/ui/components/button";
import { authClient } from "@/lib/auth-client";

export default function LoginForm() {
	return (
		<div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center shadow-sm">
			<h1 className="font-display text-xl font-bold text-foreground">
				Login to refeat
			</h1>
			<p className="mt-1 font-mono text-xs text-muted-foreground">
				Continue with Google to start tracking
			</p>
			<Button
				variant="outline"
				className="mt-6 w-full font-mono"
				onClick={() =>
					authClient.signIn.social({ provider: "google", callbackURL: "/" })
				}
			>
				Continue with Google
			</Button>
		</div>
	);
}

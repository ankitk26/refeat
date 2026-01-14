import { Link } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import CreateTrackerButton from "./create-tracker-button";
import { ThemeSwitcher } from "./theme-switcher";
import { Button } from "./ui/button";

export default function Header() {
	const logout = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					location.reload();
				},
			},
		});
	};

	return (
		<header className="flex items-center justify-between py-4 border-b">
			<Link to="/">
				<h1 className="text-lg font-semibold">refeat</h1>
			</Link>
			<div className="flex items-center gap-4">
				<ThemeSwitcher />
				<CreateTrackerButton />
				<Button type="button" variant="secondary" onClick={logout}>
					Logout
				</Button>
			</div>
		</header>
	);
}

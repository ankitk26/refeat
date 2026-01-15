import { IconLogout, IconMoon, IconSun } from "@tabler/icons-react";
import { Link, useHydrated } from "@tanstack/react-router";
import { useTheme } from "better-themes";
import { authClient } from "@/lib/auth-client";
import CreateTrackerButton from "./create-tracker-button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function Header() {
	const { data: session } = authClient.useSession();
	const hydrated = useHydrated();
	const { theme, setTheme } = useTheme();
	const user = session?.user;

	const logout = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					location.reload();
				},
			},
		});
	};

	const toggleTheme = () => {
		setTheme(theme === "dark" ? "light" : "dark");
	};

	const getInitials = (name?: string | null) => {
		if (!name) return "U";
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 py-4 border-b">
			<Link to="/">
				<h1 className="text-lg font-semibold">refeat</h1>
			</Link>
			<div className="flex items-center gap-2 sm:gap-4 flex-wrap">
				<CreateTrackerButton />
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<button className="flex items-center gap-2">
								<Avatar size="sm">
									<AvatarImage src={user?.image ?? ""} />
									<AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
								</Avatar>
							</button>
						}
					/>
					<DropdownMenuContent align="end" className="w-56">
						<DropdownMenuItem>
							<div className="flex flex-col space-y-1">
								<p className="text-sm font-medium">{user?.name ?? "User"}</p>
								<p className="text-xs text-muted-foreground">
									{user?.email ?? ""}
								</p>
							</div>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={toggleTheme}>
							{hydrated && (theme === "dark" ? <IconMoon /> : <IconSun />)}
							<span className="ml-2">
								{theme === "dark" ? "Light mode" : "Dark mode"}
							</span>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={logout}>
							<IconLogout />
							<span className="ml-2">Logout</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}

import { IconLoader, IconMoon, IconSun } from "@tabler/icons-react";
import { useHydrated } from "@tanstack/react-router";
import { useTheme } from "better-themes";
import { Button } from "./ui/button";

export function ThemeSwitcher() {
	const hydrated = useHydrated();
	const { theme, setTheme } = useTheme();

	return (
		<Button
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			disabled={!hydrated}
			type="button"
			size="icon"
			variant="outline"
		>
			{hydrated && (theme === "dark" ? <IconMoon /> : <IconSun />)}
			{!hydrated && <IconLoader />}
		</Button>
	);
}

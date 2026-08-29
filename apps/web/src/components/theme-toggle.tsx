import { Moon, Sun } from "lucide-react";
import { useDarkMode } from "@/lib/dark-mode";

/**
 * Pixel-styled button that switches the app between light and dark theme.
 * Uses the shared btn-pixel class with the same icon-button treatment as the
 * sign-out button so the header controls stay identical in size.
 */
export default function ThemeToggle() {
	const [isDark, setDarkModeEnabled] = useDarkMode();

	return (
		<button
			onClick={() => setDarkModeEnabled(!isDark)}
			className="btn-pixel bg-card !px-3 text-foreground hover:bg-secondary"
			aria-label={isDark ? "switch to light mode" : "switch to dark mode"}
			title={isDark ? "light mode" : "dark mode"}
		>
			{isDark ? (
				<Sun className="h-3.5 w-3.5 text-lime" />
			) : (
				<Moon className="h-3.5 w-3.5" />
			)}
		</button>
	);
}

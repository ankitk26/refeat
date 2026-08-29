import { useEffect, useState } from "react";

export const THEME_STORAGE_KEY = "refeat-theme";

/** Reads whether the <html> element currently has the `dark` theme class. */
function isDocumentDark(): boolean {
	return document.documentElement.classList.contains("dark");
}

/**
 * Applies or removes the `dark` theme class on <html> and persists
 * the choice so the bootstrap script in __root can restore it on reload.
 */
export function setDarkModeEnabled(isDark: boolean): void {
	document.documentElement.classList.toggle("dark", isDark);
	try {
		localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
	} catch {
		// storage unavailable (private mode etc.) — theme just won't persist
	}
}

/**
 * Tracks whether the document currently has the `dark` theme class applied.
 * Stays in sync even when something else (e.g. another toggle instance)
 * changes the class, via a MutationObserver on <html> class attribute.
 */
export function useDarkMode(): [boolean, typeof setDarkModeEnabled] {
	const [isDark, setIsDark] = useState(isDocumentDark);

	useEffect(() => {
		const themeClassObserver = new MutationObserver(() => {
			setIsDark(isDocumentDark());
		});
		themeClassObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});
		return () => themeClassObserver.disconnect();
	}, []);

	return [isDark, setDarkModeEnabled];
}

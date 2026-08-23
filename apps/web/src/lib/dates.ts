export function toISO(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

export function fromISO(s: string): Date {
	const parts = s.split("-").map(Number);
	const y = parts[0] ?? 1970;
	const m = parts[1] ?? 1;
	const d = parts[2] ?? 1;
	return new Date(y, m - 1, d);
}

export function formatMonthYear(date: Date): string {
	return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatShort(date: Date): string {
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function daysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate();
}

export function getMonthDays(year: number, month: number): Date[] {
	const n = daysInMonth(year, month);
	return Array.from({ length: n }, (_, i) => new Date(year, month, i + 1));
}

export function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

export function weekday(date: Date): number {
	return date.getDay(); // 0 Sun
}

export type DayStatus =
	| "done"
	| "failed"
	| "pending"
	| "not_required"
	| "future";

export function getDayStatus(
	date: Date,
	tracker: { startDate: string; targetDate?: string; frequency: number[] },
	completionsSet: Set<string>,
	today: Date,
): DayStatus {
	const iso = toISO(date);
	const start = fromISO(tracker.startDate);
	// before start
	if (date < start) return "not_required";
	if (tracker.targetDate) {
		const target = fromISO(tracker.targetDate);
		if (date > target) return "not_required";
	}
	const isRequired = tracker.frequency.includes(weekday(date));
	if (!isRequired) return "not_required";
	if (completionsSet.has(iso)) return "done";
	// normalize today to midnight
	const todayMid = new Date(
		today.getFullYear(),
		today.getMonth(),
		today.getDate(),
	);
	const dateMid = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	if (dateMid < todayMid) return "failed";
	if (isSameDay(date, today)) return "pending";
	return "future";
}

export function computeMonthStats(
	dates: Date[],
	tracker: { startDate: string; targetDate?: string; frequency: number[] },
	completionsSet: Set<string>,
	today: Date,
) {
	let done = 0;
	let failed = 0;
	let required = 0;
	for (const d of dates) {
		const s = getDayStatus(d, tracker, completionsSet, today);
		if (s === "done") {
			done++;
			required++;
		} else if (s === "failed") {
			failed++;
			required++;
		} else if (s === "pending" || s === "future") {
			required++;
		}
	}
	return { done, failed, required };
}

export function computeCurrentStreak(
	tracker: { startDate: string; targetDate?: string; frequency: number[] },
	completionsSet: Set<string>,
	today: Date,
): number {
	// Count consecutive required days up to today that are done, backwards
	let streak = 0;
	const cursor = new Date(today);
	// go back up to 120 days max
	for (let i = 0; i < 180; i++) {
		const status = getDayStatus(cursor, tracker, completionsSet, today);
		if (status === "not_required" || status === "future") {
			cursor.setDate(cursor.getDate() - 1);
			continue;
		}
		if (status === "done") {
			streak++;
			cursor.setDate(cursor.getDate() - 1);
		} else if (status === "pending") {
			// today pending, don't count but don't break? allow streak to continue from yesterday
			cursor.setDate(cursor.getDate() - 1);
			continue;
		} else {
			break;
		}
	}
	return streak;
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

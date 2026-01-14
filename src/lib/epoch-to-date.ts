export const epochToDate = (epoch: number, timezone: string) =>
	new Intl.DateTimeFormat("en", {
		dateStyle: "medium", // "Jan 14, 2025"
		timeZone: timezone,
	}).format(epoch);

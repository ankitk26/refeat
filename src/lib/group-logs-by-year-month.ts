import { Doc } from "convex/_generated/dataModel";

type MonthGroup = {
	month: number;
	logs: Doc<"trackerLogs">[];
};

type YearGroup = {
	year: number;
	months: MonthGroup[];
};

export const groupLogsByYearAndMonth = (
	logs: Doc<"trackerLogs">[]
): YearGroup[] => {
	const yearMap = new Map<number, Map<number, Doc<"trackerLogs">[]>>();

	// Group logs
	for (const log of logs) {
		if (!yearMap.has(log.userYear)) {
			yearMap.set(log.userYear, new Map());
		}

		const monthMap = yearMap.get(log.userYear)!;

		if (!monthMap.has(log.userMonth)) {
			monthMap.set(log.userMonth, []);
		}

		monthMap.get(log.userMonth)!.push(log);
	}

	// Convert to sorted array structure
	return Array.from(yearMap.entries())
		.sort(([yearA], [yearB]) => yearB - yearA)
		.map(([year, monthMap]) => ({
			year,
			months: Array.from(monthMap.entries())
				.sort(([monthA], [monthB]) => monthB - monthA)
				.map(([month, logs]) => ({
					month,
					logs,
				})),
		}));
};

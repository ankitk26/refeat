/**
 * Test script for tracker log date handling
 *
 * Intention:
 * - Store logs with exact epoch time and timezone from client's timezone
 * - Insert one-time day, month, year from user's perspective
 *
 * Run with: bun run test_date_cases.ts
 */

import { toZonedTime, fromZonedTime } from "date-fns-tz";

// ============================================================================
// Types
// ============================================================================

interface TrackerLog {
	trackerId: string;
	logTimeEpoch: number;
	clientSideTimezone: string;
	userDay: number;
	userMonth: number;
	userYear: number;
	isAccomplished: boolean;
}

interface TestCase {
	name: string;
	startTimeEpoch: number; // tracker.startTime from client
	clientSideTimezone: string;
	serverNow?: number; // simulate server's Date.now(), defaults to actual now
	expectedLogs: Array<{
		userDay: number;
		userMonth: number;
		userYear: number;
	}>;
}

// ============================================================================
// BUGGY IMPLEMENTATION (current convex/trackerLogs.ts behavior)
// Problem: Iterates over UTC days, not user-local days
// ============================================================================

function generateTrackerLogs_BUGGY(
	trackerId: string,
	startTime: number,
	clientSideTimezone: string,
	serverNow: number = Date.now()
): TrackerLog[] {
	const logs: TrackerLog[] = [];

	const startDay = new Date(startTime);
	startDay.setUTCHours(0, 0, 0, 0);

	const endDay = new Date(serverNow);
	endDay.setUTCHours(0, 0, 0, 0);

	for (
		let cursor = new Date(startDay);
		cursor.getTime() <= endDay.getTime();
		cursor.setUTCDate(cursor.getUTCDate() + 1)
	) {
		const z = toZonedTime(cursor, clientSideTimezone);
		logs.push({
			trackerId,
			logTimeEpoch: cursor.getTime(),
			clientSideTimezone,
			userDay: z.getDate(),
			userMonth: z.getMonth() + 1,
			userYear: z.getFullYear(),
			isAccomplished: false,
		});
	}

	return logs;
}

// ============================================================================
// FIXED IMPLEMENTATION
// Correctly iterates over user-local days
// ============================================================================

function generateTrackerLogs(
	trackerId: string,
	startTime: number,
	clientSideTimezone: string,
	serverNow: number = Date.now()
): TrackerLog[] {
	const logs: TrackerLog[] = [];

	// Convert start time to user's local date and get start of that day
	const startInUserTz = toZonedTime(new Date(startTime), clientSideTimezone);
	const startUserDay = new Date(
		startInUserTz.getFullYear(),
		startInUserTz.getMonth(),
		startInUserTz.getDate()
	);

	// Convert server now to user's local date and get start of that day
	const nowInUserTz = toZonedTime(new Date(serverNow), clientSideTimezone);
	const endUserDay = new Date(
		nowInUserTz.getFullYear(),
		nowInUserTz.getMonth(),
		nowInUserTz.getDate()
	);

	// Iterate over user's local days
	for (
		let cursor = new Date(startUserDay);
		cursor.getTime() <= endUserDay.getTime();
		cursor.setDate(cursor.getDate() + 1)
	) {
		// Convert this local midnight to UTC epoch
		const localMidnightUtc = fromZonedTime(cursor, clientSideTimezone);

		logs.push({
			trackerId,
			logTimeEpoch: localMidnightUtc.getTime(),
			clientSideTimezone,
			userDay: cursor.getDate(),
			userMonth: cursor.getMonth() + 1,
			userYear: cursor.getFullYear(),
			isAccomplished: false,
		});
	}

	return logs;
}

// ============================================================================
// Test Utilities
// ============================================================================

type Implementation = "fixed" | "buggy";

function formatDate(epoch: number, tz: string): string {
	const d = toZonedTime(new Date(epoch), tz);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatUTC(epoch: number): string {
	const d = new Date(epoch);
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;
}

function runTest(
	testCase: TestCase,
	impl: Implementation = "fixed"
): { passed: boolean; details: string } {
	const generateFn =
		impl === "fixed" ? generateTrackerLogs : generateTrackerLogs_BUGGY;
	const logs = generateFn(
		"test-tracker",
		testCase.startTimeEpoch,
		testCase.clientSideTimezone,
		testCase.serverNow
	);

	const details: string[] = [];
	details.push(`  Start time (UTC): ${formatUTC(testCase.startTimeEpoch)}`);
	details.push(
		`  Start time (${testCase.clientSideTimezone}): ${formatDate(testCase.startTimeEpoch, testCase.clientSideTimezone)}`
	);
	if (testCase.serverNow) {
		details.push(`  Server now (UTC): ${formatUTC(testCase.serverNow)}`);
	}
	details.push(
		`  Expected ${testCase.expectedLogs.length} logs, got ${logs.length}`
	);

	let passed = logs.length === testCase.expectedLogs.length;

	for (
		let i = 0;
		i < Math.max(logs.length, testCase.expectedLogs.length);
		i++
	) {
		const log = logs[i];
		const expected = testCase.expectedLogs[i];

		if (!log && expected) {
			details.push(
				`  ❌ Log ${i + 1}: MISSING (expected ${expected.userYear}-${expected.userMonth}-${expected.userDay})`
			);
			passed = false;
		} else if (log && !expected) {
			details.push(
				`  ❌ Log ${i + 1}: UNEXPECTED (got ${log.userYear}-${log.userMonth}-${log.userDay})`
			);
			passed = false;
		} else if (log && expected) {
			const match =
				log.userDay === expected.userDay &&
				log.userMonth === expected.userMonth &&
				log.userYear === expected.userYear;

			if (match) {
				details.push(
					`  ✅ Log ${i + 1}: ${log.userYear}-${log.userMonth}-${log.userDay} (epoch: ${log.logTimeEpoch})`
				);
			} else {
				details.push(
					`  ❌ Log ${i + 1}: expected ${expected.userYear}-${expected.userMonth}-${expected.userDay}, got ${log.userYear}-${log.userMonth}-${log.userDay}`
				);
				passed = false;
			}
		}
	}

	return { passed, details: details.join("\n") };
}

// ============================================================================
// Test Cases
// ============================================================================

const testCases: TestCase[] = [
	// -------------------------------------------------------------------------
	// Basic Cases
	// -------------------------------------------------------------------------
	{
		name: "Basic: Same day creation (UTC timezone)",
		startTimeEpoch: Date.UTC(2026, 0, 14, 12, 0, 0), // Jan 14, 2026 12:00 UTC
		clientSideTimezone: "UTC",
		serverNow: Date.UTC(2026, 0, 14, 18, 0, 0), // Same day
		expectedLogs: [{ userDay: 14, userMonth: 1, userYear: 2026 }],
	},
	{
		name: "Basic: Multi-day span (3 days)",
		startTimeEpoch: Date.UTC(2026, 0, 12, 10, 0, 0), // Jan 12, 2026
		clientSideTimezone: "UTC",
		serverNow: Date.UTC(2026, 0, 14, 18, 0, 0), // Jan 14, 2026
		expectedLogs: [
			{ userDay: 12, userMonth: 1, userYear: 2026 },
			{ userDay: 13, userMonth: 1, userYear: 2026 },
			{ userDay: 14, userMonth: 1, userYear: 2026 },
		],
	},

	// -------------------------------------------------------------------------
	// Timezone Ahead of UTC (e.g., Asia/Tokyo UTC+9, Pacific/Auckland UTC+12/13)
	// -------------------------------------------------------------------------
	{
		name: "Timezone ahead: Tokyo (UTC+9) - user sees next day",
		// Jan 14, 2026 20:00 UTC = Jan 15, 2026 05:00 JST
		// Server now Jan 14 22:00 UTC = Jan 15, 2026 07:00 JST
		// User's perspective: Jan 15 only (same day)
		startTimeEpoch: Date.UTC(2026, 0, 14, 20, 0, 0),
		clientSideTimezone: "Asia/Tokyo",
		serverNow: Date.UTC(2026, 0, 14, 22, 0, 0),
		expectedLogs: [{ userDay: 15, userMonth: 1, userYear: 2026 }],
	},
	{
		name: "Timezone ahead: Auckland (UTC+13 in summer) - extreme case",
		// Jan 14, 2026 10:00 UTC = Jan 14, 2026 23:00 NZDT
		// Server now Jan 14 12:00 UTC = Jan 15, 2026 01:00 NZDT
		// User's perspective: Jan 14 evening -> Jan 15 morning = 2 days
		startTimeEpoch: Date.UTC(2026, 0, 14, 10, 0, 0),
		clientSideTimezone: "Pacific/Auckland",
		serverNow: Date.UTC(2026, 0, 14, 12, 0, 0),
		expectedLogs: [
			{ userDay: 14, userMonth: 1, userYear: 2026 },
			{ userDay: 15, userMonth: 1, userYear: 2026 },
		],
	},

	// -------------------------------------------------------------------------
	// Timezone Behind UTC (e.g., America/Los_Angeles UTC-8, Pacific/Honolulu UTC-10)
	// -------------------------------------------------------------------------
	{
		name: "Timezone behind: Los Angeles (UTC-8) - spans two user days",
		// Jan 14, 2026 02:00 UTC = Jan 13, 2026 18:00 PST
		// Server now Jan 14 10:00 UTC = Jan 14, 2026 02:00 PST
		// User's perspective: Jan 13 evening -> Jan 14 morning = 2 days
		startTimeEpoch: Date.UTC(2026, 0, 14, 2, 0, 0),
		clientSideTimezone: "America/Los_Angeles",
		serverNow: Date.UTC(2026, 0, 14, 10, 0, 0),
		expectedLogs: [
			{ userDay: 13, userMonth: 1, userYear: 2026 },
			{ userDay: 14, userMonth: 1, userYear: 2026 },
		],
	},
	{
		name: "Timezone behind: Honolulu (UTC-10) - spans two user days",
		// Jan 14, 2026 08:00 UTC = Jan 13, 2026 22:00 HST
		// Server now Jan 14 12:00 UTC = Jan 14, 2026 02:00 HST
		// User's perspective: Jan 13 evening -> Jan 14 morning = 2 days
		startTimeEpoch: Date.UTC(2026, 0, 14, 8, 0, 0),
		clientSideTimezone: "Pacific/Honolulu",
		serverNow: Date.UTC(2026, 0, 14, 12, 0, 0),
		expectedLogs: [
			{ userDay: 13, userMonth: 1, userYear: 2026 },
			{ userDay: 14, userMonth: 1, userYear: 2026 },
		],
	},

	// -------------------------------------------------------------------------
	// Midnight Boundary Cases
	// -------------------------------------------------------------------------
	{
		name: "Midnight: Created exactly at UTC midnight",
		startTimeEpoch: Date.UTC(2026, 0, 14, 0, 0, 0), // Exactly midnight UTC
		clientSideTimezone: "UTC",
		serverNow: Date.UTC(2026, 0, 14, 0, 0, 1), // 1 second later
		expectedLogs: [{ userDay: 14, userMonth: 1, userYear: 2026 }],
	},
	{
		name: "Midnight: Created 1ms before UTC midnight",
		startTimeEpoch: Date.UTC(2026, 0, 13, 23, 59, 59, 999),
		clientSideTimezone: "UTC",
		serverNow: Date.UTC(2026, 0, 14, 0, 0, 1),
		expectedLogs: [
			{ userDay: 13, userMonth: 1, userYear: 2026 },
			{ userDay: 14, userMonth: 1, userYear: 2026 },
		],
	},
	{
		name: "Midnight: User's local midnight differs from UTC",
		// Jan 14, 2026 05:00 UTC = Jan 14, 2026 00:00 EST (exactly midnight in New York)
		// Server now Jan 14 06:00 UTC = Jan 14, 2026 01:00 EST
		// User's perspective: only Jan 14 (same day, just past midnight)
		startTimeEpoch: Date.UTC(2026, 0, 14, 5, 0, 0),
		clientSideTimezone: "America/New_York",
		serverNow: Date.UTC(2026, 0, 14, 6, 0, 0),
		expectedLogs: [{ userDay: 14, userMonth: 1, userYear: 2026 }],
	},

	// -------------------------------------------------------------------------
	// Month Boundary Cases
	// -------------------------------------------------------------------------
	{
		name: "Month boundary: End of January (31 days)",
		startTimeEpoch: Date.UTC(2026, 0, 30, 12, 0, 0), // Jan 30
		clientSideTimezone: "UTC",
		serverNow: Date.UTC(2026, 1, 1, 12, 0, 0), // Feb 1
		expectedLogs: [
			{ userDay: 30, userMonth: 1, userYear: 2026 },
			{ userDay: 31, userMonth: 1, userYear: 2026 },
			{ userDay: 1, userMonth: 2, userYear: 2026 },
		],
	},
	{
		name: "Month boundary: End of February (non-leap year)",
		startTimeEpoch: Date.UTC(2027, 1, 27, 12, 0, 0), // Feb 27, 2027
		clientSideTimezone: "UTC",
		serverNow: Date.UTC(2027, 2, 1, 12, 0, 0), // Mar 1, 2027
		expectedLogs: [
			{ userDay: 27, userMonth: 2, userYear: 2027 },
			{ userDay: 28, userMonth: 2, userYear: 2027 },
			{ userDay: 1, userMonth: 3, userYear: 2027 },
		],
	},
	{
		name: "Month boundary: February in leap year (2028)",
		startTimeEpoch: Date.UTC(2028, 1, 28, 12, 0, 0), // Feb 28, 2028
		clientSideTimezone: "UTC",
		serverNow: Date.UTC(2028, 2, 1, 12, 0, 0), // Mar 1, 2028
		expectedLogs: [
			{ userDay: 28, userMonth: 2, userYear: 2028 },
			{ userDay: 29, userMonth: 2, userYear: 2028 }, // Leap day!
			{ userDay: 1, userMonth: 3, userYear: 2028 },
		],
	},

	// -------------------------------------------------------------------------
	// Year Boundary Cases
	// -------------------------------------------------------------------------
	{
		name: "Year boundary: Dec 31 to Jan 1",
		startTimeEpoch: Date.UTC(2025, 11, 31, 12, 0, 0), // Dec 31, 2025
		clientSideTimezone: "UTC",
		serverNow: Date.UTC(2026, 0, 1, 12, 0, 0), // Jan 1, 2026
		expectedLogs: [
			{ userDay: 31, userMonth: 12, userYear: 2025 },
			{ userDay: 1, userMonth: 1, userYear: 2026 },
		],
	},
	{
		name: "Year boundary: With timezone (Sydney sees new year early)",
		// Dec 31, 2025 12:00 UTC = Dec 31, 2025 23:00 AEDT (user's Dec 31)
		// Dec 31, 2025 14:00 UTC = Jan 1, 2026 01:00 AEDT (user's Jan 1)
		// User's perspective: Dec 31 -> Jan 1 = 2 days crossing year boundary
		startTimeEpoch: Date.UTC(2025, 11, 31, 12, 0, 0),
		clientSideTimezone: "Australia/Sydney",
		serverNow: Date.UTC(2025, 11, 31, 14, 0, 0),
		expectedLogs: [
			{ userDay: 31, userMonth: 12, userYear: 2025 },
			{ userDay: 1, userMonth: 1, userYear: 2026 },
		],
	},
	{
		name: "Year boundary: With timezone (LA sees old year late)",
		// Jan 1, 2026 06:00 UTC = Dec 31, 2025 22:00 PST
		// Server now Jan 1 10:00 UTC = Jan 1, 2026 02:00 PST
		// User's perspective: Dec 31, 2025 -> Jan 1, 2026 = 2 days crossing year boundary
		startTimeEpoch: Date.UTC(2026, 0, 1, 6, 0, 0),
		clientSideTimezone: "America/Los_Angeles",
		serverNow: Date.UTC(2026, 0, 1, 10, 0, 0),
		expectedLogs: [
			{ userDay: 31, userMonth: 12, userYear: 2025 },
			{ userDay: 1, userMonth: 1, userYear: 2026 },
		],
	},

	// -------------------------------------------------------------------------
	// DST (Daylight Saving Time) Cases
	// -------------------------------------------------------------------------
	{
		name: "DST: Spring forward (US) - March 2026",
		// DST starts March 8, 2026 at 2:00 AM local -> 3:00 AM
		// Mar 7 12:00 UTC = Mar 7 07:00 EST
		// Mar 9 12:00 UTC = Mar 9 08:00 EDT (after DST)
		// User's perspective: Mar 7 -> Mar 9 = 3 days
		startTimeEpoch: Date.UTC(2026, 2, 7, 12, 0, 0),
		clientSideTimezone: "America/New_York",
		serverNow: Date.UTC(2026, 2, 9, 12, 0, 0),
		expectedLogs: [
			{ userDay: 7, userMonth: 3, userYear: 2026 },
			{ userDay: 8, userMonth: 3, userYear: 2026 }, // DST transition day
			{ userDay: 9, userMonth: 3, userYear: 2026 },
		],
	},
	{
		name: "DST: Fall back (US) - November 2026",
		// DST ends November 1, 2026 at 2:00 AM local -> 1:00 AM
		// Nov 1 04:00 UTC = Nov 1 00:00 EDT (midnight, just before DST ends)
		// Nov 2 12:00 UTC = Nov 2 07:00 EST
		// User's perspective: Nov 1 -> Nov 2 = 2 days
		startTimeEpoch: Date.UTC(2026, 10, 1, 4, 0, 0),
		clientSideTimezone: "America/New_York",
		serverNow: Date.UTC(2026, 10, 2, 12, 0, 0),
		expectedLogs: [
			{ userDay: 1, userMonth: 11, userYear: 2026 },
			{ userDay: 2, userMonth: 11, userYear: 2026 },
		],
	},
	{
		name: "DST: European summer time (UK)",
		// BST starts last Sunday of March
		startTimeEpoch: Date.UTC(2026, 2, 28, 12, 0, 0), // Mar 28
		clientSideTimezone: "Europe/London",
		serverNow: Date.UTC(2026, 2, 30, 12, 0, 0), // Mar 30
		expectedLogs: [
			{ userDay: 28, userMonth: 3, userYear: 2026 },
			{ userDay: 29, userMonth: 3, userYear: 2026 }, // DST transition
			{ userDay: 30, userMonth: 3, userYear: 2026 },
		],
	},

	// -------------------------------------------------------------------------
	// Edge Cases: International Date Line
	// -------------------------------------------------------------------------
	{
		name: "Date line: Kiritimati (UTC+14, first to see new day)",
		// Jan 13, 2026 12:00 UTC = Jan 14, 2026 02:00 in Kiritimati (user's Jan 14)
		// Jan 13, 2026 14:00 UTC = Jan 14, 2026 04:00 in Kiritimati (user's Jan 14)
		// User's perspective: only Jan 14 (same day)
		startTimeEpoch: Date.UTC(2026, 0, 13, 12, 0, 0),
		clientSideTimezone: "Pacific/Kiritimati",
		serverNow: Date.UTC(2026, 0, 13, 14, 0, 0),
		expectedLogs: [{ userDay: 14, userMonth: 1, userYear: 2026 }],
	},
	{
		name: "Date line: Baker Island (UTC-12, last to see day)",
		// Jan 14, 2026 10:00 UTC = Jan 13, 2026 22:00 in Baker Island
		// Jan 14, 2026 14:00 UTC = Jan 14, 2026 02:00 in Baker Island
		// User's perspective: Jan 13 evening -> Jan 14 morning = 2 days
		startTimeEpoch: Date.UTC(2026, 0, 14, 10, 0, 0),
		clientSideTimezone: "Etc/GMT+12", // Note: POSIX sign is inverted
		serverNow: Date.UTC(2026, 0, 14, 14, 0, 0),
		expectedLogs: [
			{ userDay: 13, userMonth: 1, userYear: 2026 },
			{ userDay: 14, userMonth: 1, userYear: 2026 },
		],
	},

	// -------------------------------------------------------------------------
	// Edge Cases: Same instant, different dates in different timezones
	// -------------------------------------------------------------------------
	{
		name: "Same instant: Tokyo user sees only Jan 15",
		// Jan 14, 2026 23:30 UTC = Jan 15, 2026 08:30 JST (user's Jan 15)
		// Jan 15, 2026 01:00 UTC = Jan 15, 2026 10:00 JST (user's Jan 15)
		// User's perspective: only Jan 15 (same day in Tokyo)
		startTimeEpoch: Date.UTC(2026, 0, 14, 23, 30, 0),
		clientSideTimezone: "Asia/Tokyo",
		serverNow: Date.UTC(2026, 0, 15, 1, 0, 0),
		expectedLogs: [{ userDay: 15, userMonth: 1, userYear: 2026 }],
	},

	// -------------------------------------------------------------------------
	// Edge Cases: Very short and very long spans
	// -------------------------------------------------------------------------
	{
		name: "Short span: Created and checked within same user day",
		// Jan 14 10:00 UTC = Jan 14 05:00 EST
		// Jan 14 10:00:01 UTC = Jan 14 05:00:01 EST
		// User's perspective: same day (Jan 14)
		startTimeEpoch: Date.UTC(2026, 0, 14, 10, 0, 0),
		clientSideTimezone: "America/New_York",
		serverNow: Date.UTC(2026, 0, 14, 10, 0, 1),
		expectedLogs: [{ userDay: 14, userMonth: 1, userYear: 2026 }],
	},
	{
		name: "Long span: Full month",
		startTimeEpoch: Date.UTC(2026, 0, 1, 12, 0, 0), // Jan 1
		clientSideTimezone: "UTC",
		serverNow: Date.UTC(2026, 0, 31, 12, 0, 0), // Jan 31
		expectedLogs: Array.from({ length: 31 }, (_, i) => ({
			userDay: i + 1,
			userMonth: 1,
			userYear: 2026,
		})),
	},

	// -------------------------------------------------------------------------
	// Edge Cases: Half-hour and 45-minute offset timezones
	// -------------------------------------------------------------------------
	{
		name: "Unusual offset: India (UTC+5:30)",
		// Jan 14, 2026 20:00 UTC = Jan 15, 2026 01:30 IST (user's Jan 15)
		// Jan 14, 2026 22:00 UTC = Jan 15, 2026 03:30 IST (user's Jan 15)
		// User's perspective: only Jan 15
		startTimeEpoch: Date.UTC(2026, 0, 14, 20, 0, 0),
		clientSideTimezone: "Asia/Kolkata",
		serverNow: Date.UTC(2026, 0, 14, 22, 0, 0),
		expectedLogs: [{ userDay: 15, userMonth: 1, userYear: 2026 }],
	},
	{
		name: "Unusual offset: Nepal (UTC+5:45)",
		// Jan 14, 2026 20:00 UTC = Jan 15, 2026 01:45 NPT (user's Jan 15)
		// Jan 14, 2026 22:00 UTC = Jan 15, 2026 03:45 NPT (user's Jan 15)
		// User's perspective: only Jan 15
		startTimeEpoch: Date.UTC(2026, 0, 14, 20, 0, 0),
		clientSideTimezone: "Asia/Kathmandu",
		serverNow: Date.UTC(2026, 0, 14, 22, 0, 0),
		expectedLogs: [{ userDay: 15, userMonth: 1, userYear: 2026 }],
	},
	{
		name: "Unusual offset: Chatham Islands (UTC+13:45 in summer)",
		// Jan 14, 2026 10:00 UTC = Jan 14, 2026 23:45 CHADT (user's Jan 14)
		// Jan 14, 2026 12:00 UTC = Jan 15, 2026 01:45 CHADT (user's Jan 15)
		// User's perspective: Jan 14 -> Jan 15 = 2 days
		startTimeEpoch: Date.UTC(2026, 0, 14, 10, 0, 0),
		clientSideTimezone: "Pacific/Chatham",
		serverNow: Date.UTC(2026, 0, 14, 12, 0, 0),
		expectedLogs: [
			{ userDay: 14, userMonth: 1, userYear: 2026 },
			{ userDay: 15, userMonth: 1, userYear: 2026 },
		],
	},
];

// ============================================================================
// Run Tests
// ============================================================================

const args = process.argv.slice(2);
const showBuggy = args.includes("--buggy");
const showBoth = args.includes("--compare");
const impl: Implementation = showBuggy ? "buggy" : "fixed";

console.log("═".repeat(80));
console.log("TRACKER LOG DATE HANDLING TEST SUITE");
console.log("═".repeat(80));
console.log();
console.log(
	`Implementation: ${showBoth ? "COMPARING BOTH" : impl.toUpperCase()}`
);
console.log();
console.log("Usage:");
console.log(
	"  bun run test_date_cases.ts           # Run with FIXED implementation"
);
console.log(
	"  bun run test_date_cases.ts --buggy   # Run with BUGGY implementation"
);
console.log(
	"  bun run test_date_cases.ts --compare # Compare both implementations"
);
console.log();

let passedCount = 0;
let failedCount = 0;
const failedTests: string[] = [];

for (const testCase of testCases) {
	if (showBoth) {
		const fixedResult = runTest(testCase, "fixed");
		const buggyResult = runTest(testCase, "buggy");

		console.log(`📋 ${testCase.name}`);
		console.log();
		console.log("  FIXED implementation:");
		console.log(
			fixedResult.details
				.split("\n")
				.map((l) => "    " + l)
				.join("\n")
		);
		console.log();
		console.log("  BUGGY implementation (current convex/trackerLogs.ts):");
		console.log(
			buggyResult.details
				.split("\n")
				.map((l) => "    " + l)
				.join("\n")
		);
		console.log();

		if (fixedResult.passed && !buggyResult.passed) {
			console.log(
				"  ⚠️  FIXED passes, BUGGY fails - this test catches the bug!"
			);
		} else if (fixedResult.passed && buggyResult.passed) {
			console.log("  ✅ Both pass - this case works in both implementations");
		} else if (!fixedResult.passed) {
			console.log("  ❌ FIXED fails - test expectation may be wrong");
		}
		console.log();
		console.log("─".repeat(80));
		console.log();

		if (fixedResult.passed) passedCount++;
		else {
			failedCount++;
			failedTests.push(testCase.name);
		}
	} else {
		const { passed, details } = runTest(testCase, impl);

		if (passed) {
			console.log(`✅ PASS: ${testCase.name}`);
			passedCount++;
		} else {
			console.log(`❌ FAIL: ${testCase.name}`);
			failedCount++;
			failedTests.push(testCase.name);
		}
		console.log(details);
		console.log();
	}
}

console.log("═".repeat(80));
console.log("SUMMARY");
console.log("═".repeat(80));
console.log(
	`Implementation tested: ${showBoth ? "FIXED (comparison mode)" : impl.toUpperCase()}`
);
console.log(`Total: ${testCases.length}`);
console.log(`Passed: ${passedCount}`);
console.log(`Failed: ${failedCount}`);

if (failedTests.length > 0) {
	console.log();
	console.log("Failed tests:");
	for (const name of failedTests) {
		console.log(`  - ${name}`);
	}
}

if (!showBoth && impl === "fixed" && failedCount === 0) {
	console.log();
	console.log("🎉 All tests pass with the FIXED implementation!");
	console.log();
	console.log("To update convex/trackerLogs.ts, replace the loop logic with:");
	console.log("─".repeat(80));
	console.log(`
import { toZonedTime, fromZonedTime } from "date-fns-tz";

// Convert start time to user's local date and get start of that day
const startInUserTz = toZonedTime(new Date(tracker.startTime), clientSideTimezone);
const startUserDay = new Date(
  startInUserTz.getFullYear(),
  startInUserTz.getMonth(),
  startInUserTz.getDate()
);

// Convert server now to user's local date and get start of that day
const nowInUserTz = toZonedTime(new Date(), clientSideTimezone);
const endUserDay = new Date(
  nowInUserTz.getFullYear(),
  nowInUserTz.getMonth(),
  nowInUserTz.getDate()
);

// Iterate over user's local days
for (
  let cursor = new Date(startUserDay);
  cursor.getTime() <= endUserDay.getTime();
  cursor.setDate(cursor.getDate() + 1)
) {
  // Convert this local midnight to UTC epoch
  const localMidnightUtc = fromZonedTime(cursor, clientSideTimezone);

  await ctx.db.insert("trackerLogs", {
    trackerId: args.trackerId,
    logTimeEpoch: localMidnightUtc.getTime(),
    clientSideTimezone: clientSideTimezone,
    userDay: cursor.getDate(),
    userMonth: cursor.getMonth() + 1,
    userYear: cursor.getFullYear(),
    isAccomplished: false,
  });
}
`);
}

console.log();
process.exit(failedCount > 0 ? 1 : 0);

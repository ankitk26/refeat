import { convexQuery } from "@convex-dev/react-query";
import { api } from "@refeat/backend/convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useConvex } from "convex/react";
import { useMemo, useState } from "react";
import LoginForm from "@/components/login-form";
import {
	fromISO,
	getDayStatus,
	getMonthDays,
	toISO,
	WEEKDAYS_SHORT,
} from "@/lib/dates";

export const Route = createFileRoute("/trackers/$id")({
	component: TrackerGate,
});

function TrackerGate() {
	return (
		<>
			<Authenticated>
				<TrackerDetail />
			</Authenticated>
			<Unauthenticated>
				<div className="grid min-h-svh place-items-center bg-background px-4 py-10">
					<LoginForm />
				</div>
			</Unauthenticated>
			<AuthLoading>
				<div className="grid min-h-svh place-items-center bg-background font-mono text-sm text-muted-foreground">
					Loading...
				</div>
			</AuthLoading>
		</>
	);
}

function TrackerDetail() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const convex = useConvex();

	const trackerQuery = useQuery(
		convexQuery(api.trackers.get, { id: id as any }),
	);
	const completionsQuery = useQuery(
		convexQuery(api.completions.listByTracker, { trackerId: id as any }),
	);

	const tracker = trackerQuery.data;
	const completions = completionsQuery.data ?? [];
	const set = useMemo(
		() => new Set<string>(completions.map((c: any) => c.date as string)),
		[completions],
	);

	const today = useMemo(() => new Date(), []);
	const [cursor, setCursor] = useState(
		() => new Date(today.getFullYear(), today.getMonth(), 1),
	);
	const year = cursor.getFullYear();
	const month = cursor.getMonth();
	const days = useMemo(() => getMonthDays(year, month), [year, month]);
	const monthLabel = cursor.toLocaleDateString("en-US", {
		month: "long",
		year: "numeric",
	});

	if (trackerQuery.isLoading) {
		return (
			<div className="min-h-svh bg-background p-4">
				<div className="mx-auto h-40 max-w-xl animate-pulse rounded-xl bg-secondary" />
			</div>
		);
	}
	if (!tracker) {
		return (
			<div className="min-h-svh bg-background p-6 text-center">
				<p className="font-mono text-sm text-muted-foreground">Not found</p>
				<Link
					to="/"
					className="mt-3 inline-block rounded-full bg-primary px-4 py-1.5 font-mono text-xs text-white"
				>
					Back
				</Link>
			</div>
		);
	}

	const doneCount = days.filter(
		(d) => getDayStatus(d, tracker, set, today) === "done",
	).length;
	const requiredCount = days.filter((d) =>
		["done", "failed", "pending", "future"].includes(
			getDayStatus(d, tracker, set, today),
		),
	).length;
	const streak = (() => {
		let s = 0;
		const c = new Date(today);
		for (let i = 0; i < 200; i++) {
			const st = getDayStatus(c, tracker, set, today);
			if (st === "not_required" || st === "future") {
				c.setDate(c.getDate() - 1);
				continue;
			}
			if (st === "done") {
				s++;
				c.setDate(c.getDate() - 1);
			} else if (st === "pending") {
				c.setDate(c.getDate() - 1);
				continue;
			} else break;
		}
		return s;
	})();

	async function toggle(date: string) {
		if (date > toISO(today)) return;
		if (getDayStatus(fromISO(date), tracker!, set, today) === "not_required")
			return;
		await convex.mutation(api.completions.toggle, {
			trackerId: id as any,
			date,
		});
	}
	async function remove() {
		if (!confirm("Delete?")) return;
		await convex.mutation(api.trackers.remove, { id: id as any });
		navigate({ to: "/" });
	}

	return (
		<div className="min-h-svh bg-background">
			<div className="mx-auto max-w-xl px-4 pb-8 md:px-6">
				<header className="flex items-center justify-between py-4">
					<Link
						to="/"
						className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground"
					>
						<span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card">
							←
						</span>{" "}
						Back
					</Link>
					<button onClick={remove} className="font-mono text-xs text-primary">
						Delete
					</button>
				</header>

				<div className="rounded-xl border border-border/40 bg-card p-4 shadow-sm">
					<div className="flex items-center justify-between">
						<h1 className="font-display text-xl leading-none font-bold text-foreground">
							{tracker.title}
						</h1>
						<span className="rounded-full bg-secondary px-2.5 py-1 font-mono text-xs text-foreground">
							{streak} streak • {doneCount}/{requiredCount}
						</span>
					</div>

					<div className="mt-4 flex items-center justify-between">
						<button
							onClick={() => setCursor(new Date(year, month - 1, 1))}
							className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white"
						>
							‹
						</button>
						<span className="font-display text-sm font-semibold text-foreground">
							{monthLabel}
						</span>
						<button
							onClick={() => setCursor(new Date(year, month + 1, 1))}
							disabled={
								new Date(year, month + 1, 1) >
								new Date(today.getFullYear(), today.getMonth() + 1, 1)
							}
							className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white disabled:opacity-30"
						>
							›
						</button>
					</div>

					<div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
						{WEEKDAYS_SHORT.map((w, i) => (
							<div
								key={i}
								className="font-mono text-xs text-muted-foreground/40"
							>
								{w}
							</div>
						))}
					</div>

					{(() => {
						const first = new Date(year, month, 1);
						const offset = (first.getDay() + 6) % 7;
						const cells: (Date | null)[] = [];
						for (let i = 0; i < offset; i++) cells.push(null);
						for (const d of days) cells.push(d);
						while (cells.length % 7 !== 0) cells.push(null);
						return (
							<div className="mt-1.5 grid grid-cols-7 gap-1.5">
								{cells.map((d, idx) => {
									if (!d) return <div key={idx} />;
									const iso = toISO(d);
									const status = getDayStatus(d, tracker, set, today);
									const isToday = iso === toISO(today);
									const clickable =
										status !== "not_required" && iso <= toISO(today);
									return (
										<button
											key={idx}
											disabled={!clickable}
											onClick={() => toggle(iso)}
											className={[
												"flex aspect-square items-center justify-center rounded-xl font-mono text-xs",
												status === "done"
													? "bg-sage text-white"
													: status === "failed"
														? "bg-primary text-white"
														: status === "not_required"
															? "bg-secondary text-muted-foreground/40"
															: "bg-card border border-border text-muted-foreground",
												isToday
													? "ring-1 ring-primary/40 ring-offset-1 ring-offset-card"
													: "",
											].join(" ")}
										>
											{d.getDate()}
										</button>
									);
								})}
							</div>
						);
					})()}
				</div>
			</div>
		</div>
	);
}

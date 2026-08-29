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
				<div className="grid min-h-svh place-items-center bg-background font-pixel text-xs text-muted-foreground uppercase">
					Loading…
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
				<div className="panel mx-auto h-56 max-w-xl animate-pulse !shadow-[4px_4px_0_0_var(--border)]" />
			</div>
		);
	}
	if (!tracker) {
		return (
			<div className="min-h-svh bg-background p-6 text-center">
				<p className="font-pixel text-xs text-muted-foreground uppercase">
					Not found
				</p>
				<Link to="/" className="btn-pixel mt-4 bg-lime text-pine">
					← back
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
		<div className="min-h-svh">
			<div className="mx-auto max-w-xl px-4 pb-16 md:px-6">
				<header className="flex items-center justify-between py-5">
					<Link
						to="/"
						className="btn-pixel bg-card text-foreground hover:bg-secondary"
					>
						← back
					</Link>
					<button
						onClick={remove}
						className="btn-pixel border-clay-deep bg-clay text-cloud shadow-[3px_3px_0_0_var(--clay-deep)] hover:bg-clay-deep"
					>
						delete
					</button>
				</header>

				{/* ── hero panel: title + streak score ─────── */}
				<section className="panel reveal p-5">
					<div className="flex items-center justify-between gap-4">
						<div className="min-w-0">
							<p className="font-pixel text-[9px] tracking-widest text-muted-foreground uppercase">
								current quest
							</p>
							<h1 className="mt-1 truncate font-display text-5xl leading-[0.95] text-foreground">
								{tracker.title}
							</h1>
						</div>
						<div className="shrink-0 rounded-md border-2 border-pine bg-pine px-4 py-3 text-center shadow-[3px_3px_0_0_var(--lime-deep)]">
							<p className="font-display text-5xl leading-none text-lime">
								{streak}
							</p>
							<p className="font-pixel text-[8px] tracking-wide text-cloud uppercase">
								day streak
							</p>
						</div>
					</div>
					<p className="mt-3 font-pixel text-[10px] text-muted-foreground">
						{doneCount}/{requiredCount} days done this month
					</p>
				</section>

				{/* ── calendar panel ───────────────────────── */}
				<section
					className="panel reveal mt-4 p-5"
					style={{ animationDelay: "80ms" }}
				>
					<div className="flex items-center justify-between">
						<button
							onClick={() => setCursor(new Date(year, month - 1, 1))}
							className="btn-pixel bg-card !px-3 text-foreground hover:bg-secondary"
						>
							‹
						</button>
						<span className="font-display text-3xl leading-none text-foreground">
							{monthLabel}
						</span>
						<button
							onClick={() => setCursor(new Date(year, month + 1, 1))}
							disabled={
								new Date(year, month + 1, 1) >
								new Date(today.getFullYear(), today.getMonth() + 1, 1)
							}
							className="btn-pixel bg-card !px-3 text-foreground hover:bg-secondary"
						>
							›
						</button>
					</div>

					<div className="mt-5 grid grid-cols-7 gap-1.5 text-center">
						{WEEKDAYS_SHORT.map((w, i) => (
							<div
								key={i}
								className="font-pixel text-[9px] tracking-wide text-muted-foreground/60 uppercase"
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
							<div className="mt-2 grid grid-cols-7 gap-1.5">
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
												"relative grid aspect-square place-items-center rounded-[3px] border-2 font-mono text-[11px]",
												clickable
													? "active:translate-y-[1px]"
													: "cursor-default",
												status === "done"
													? "tile border-pine bg-lime text-pine"
													: status === "failed"
														? "tile border-pine bg-clay text-cloud"
														: status === "not_required"
															? "tile-off border-transparent bg-secondary/70 text-muted-foreground/40"
															: "tile-off border-input bg-card text-muted-foreground",
												isToday
													? "!border-pine !bg-pine !text-lime font-bold tile-today"
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

					{/* legend */}
					<div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t-2 border-dashed border-border/40 pt-4 font-pixel text-[8px] tracking-wide text-muted-foreground uppercase">
						<span className="flex items-center gap-1.5">
							<span className="h-2.5 w-2.5 rounded-[2px] border border-pine bg-lime" />
							done
						</span>
						<span className="flex items-center gap-1.5">
							<span className="h-2.5 w-2.5 rounded-[2px] border border-pine bg-clay" />
							missed
						</span>
						<span className="flex items-center gap-1.5">
							<span className="h-2.5 w-2.5 rounded-[2px] border border-input bg-card" />
							pending
						</span>
						<span className="flex items-center gap-1.5">
							<span className="h-2.5 w-2.5 rounded-[2px] bg-secondary/70" />
							rest
						</span>
						<span className="flex items-center gap-1.5">
							<span className="h-2.5 w-2.5 rounded-[2px] border border-pine bg-pine shadow-[1.5px_1.5px_0_0_var(--lime-deep)]" />
							today
						</span>
					</div>
				</section>
			</div>
		</div>
	);
}

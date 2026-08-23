import { convexQuery } from "@convex-dev/react-query";
import { api } from "@refeat/backend/convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Authenticated,
	AuthLoading,
	Unauthenticated,
	useConvex,
	useMutation as useConvexMutation,
} from "convex/react";
import { useEffect, useMemo, useState } from "react";
import LoginForm from "@/components/login-form";
import {
	computeCurrentStreak,
	fromISO,
	getDayStatus,
	getMonthDays,
	toISO,
} from "@/lib/dates";

export const Route = createFileRoute("/")({
	component: HomeGate,
});

function HomeGate() {
	return (
		<>
			<Authenticated>
				<Home />
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

const DAYS = [
	{ label: "Mon", v: 1 },
	{ label: "Tue", v: 2 },
	{ label: "Wed", v: 3 },
	{ label: "Thu", v: 4 },
	{ label: "Fri", v: 5 },
	{ label: "Sat", v: 6 },
	{ label: "Sun", v: 0 },
];

function Home() {
	const trackersQuery = useQuery(convexQuery(api.trackers.list, {}));
	const trackers = trackersQuery.data ?? [];
	const [showAdd, setShowAdd] = useState(false);
	const today = useMemo(() => new Date(), []);
	const ensureProfile = useConvexMutation(api.profiles.ensureMyProfile);
	useEffect(() => {
		ensureProfile({}).catch(() => {});
	}, [ensureProfile]);

	return (
		<div className="min-h-svh bg-background">
			<div className="mx-auto max-w-xl px-4 pb-10 md:px-6">
				<header className="flex items-center justify-between py-4">
					<div className="flex items-center gap-2">
						<span className="text-sm">🌲</span>
						<span className="font-display text-sm font-semibold tracking-tight text-foreground">
							refeat
						</span>
					</div>
					<button
						onClick={() => setShowAdd(true)}
						className="rounded-full bg-primary px-4 py-1.5 font-mono text-xs font-medium text-primary-foreground hover:bg-primary/90"
					>
						+ New
					</button>
				</header>

				<div className="pt-1">
					<h1 className="font-display text-2xl leading-none font-bold tracking-tight text-foreground">
						Your habits
					</h1>
					<p className="mt-1 font-mono text-xs text-muted-foreground">
						{today.toLocaleDateString("en-US", {
							weekday: "long",
							month: "long",
							day: "numeric",
						})}{" "}
						• {trackers.length} {trackers.length === 1 ? "tracker" : "trackers"}
					</p>
				</div>

				<div className="mt-5 grid gap-3">
					{trackersQuery.isLoading &&
						[0, 1].map((i) => (
							<div
								key={i}
								className="h-28 animate-pulse rounded-xl bg-secondary"
							/>
						))}
					{trackers.length === 0 && !trackersQuery.isLoading && (
						<div className="rounded-xl border border-dashed border-border/60 bg-card/70 p-6 text-center">
							<p className="font-display text-sm font-semibold text-foreground">
								No habits yet
							</p>
							<p className="mx-auto mt-1 max-w-[26ch] font-mono text-xs text-muted-foreground">
								Add a habit to start tracking.
							</p>
							<button
								onClick={() => setShowAdd(true)}
								className="mt-3 rounded-full bg-primary px-4 py-1.5 font-mono text-xs text-white"
							>
								Add habit
							</button>
						</div>
					)}
					{trackers.map((t: any) => (
						<TrackerCard key={t._id} tracker={t} />
					))}
				</div>
			</div>
			{showAdd && <AddTrackerDialog onClose={() => setShowAdd(false)} />}
		</div>
	);
}

function TrackerCard({ tracker }: { tracker: any }) {
	const completionsQuery = useQuery(
		convexQuery(api.completions.listByTracker, { trackerId: tracker._id }),
	);
	const completions = completionsQuery.data ?? [];
	const set = useMemo(
		() => new Set<string>(completions.map((c: any) => c.date as string)),
		[completions],
	);
	const today = useMemo(() => new Date(), []);
	const year = today.getFullYear();
	const month = today.getMonth();
	const days = useMemo(() => getMonthDays(year, month), [year, month]);
	const streak = useMemo(
		() => computeCurrentStreak(tracker, set, today),
		[tracker, set, today],
	);

	return (
		<Link
			to="/trackers/$id"
			params={{ id: tracker._id }}
			className="block rounded-xl border border-border/40 bg-card p-3 shadow-sm"
		>
			<div className="flex items-center justify-between gap-2">
				<h3 className="truncate font-display text-sm font-bold text-foreground">
					{tracker.title}
				</h3>
				<span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 font-mono text-xs text-foreground">
					{streak} streak
				</span>
			</div>
			<div className="mt-3 grid grid-cols-14 gap-1.5">
				{days.map((d) => {
					const status = getDayStatus(d, tracker, set, today);
					const isToday = toISO(d) === toISO(today);
					return (
						<div
							key={toISO(d)}
							className={[
								"flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs",
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
						</div>
					);
				})}
			</div>
		</Link>
	);
}

function AddTrackerDialog({ onClose }: { onClose: () => void }) {
	const [title, setTitle] = useState("");
	const [startDate, setStartDate] = useState(() => toISO(new Date()));
	const [targetDate, setTargetDate] = useState("");
	const [freq, setFreq] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
	const { mutateAsync, isPending } = useConvexCreate();
	function toggleDay(v: number) {
		setFreq((prev) =>
			prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v].sort(),
		);
	}
	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!title.trim()) return;
		if (freq.length === 0) return alert("Pick at least one day");
		await mutateAsync({
			title: title.trim(),
			startDate,
			targetDate: targetDate || undefined,
			frequency: freq,
		});
		onClose();
	}
	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-0 backdrop-blur-sm md:items-center md:p-4"
			onClick={onClose}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				className="w-full max-w-md rounded-t-xl border border-border bg-card p-4 shadow-xl md:rounded-xl"
			>
				<div className="flex items-center justify-between">
					<h3 className="font-display text-sm font-bold text-foreground">
						New habit
					</h3>
					<button
						onClick={onClose}
						className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white text-xs"
					>
						✕
					</button>
				</div>
				<form onSubmit={handleSubmit} className="mt-4 grid gap-3">
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Habit title"
						className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-foreground"
						required
						maxLength={48}
					/>
					<div className="grid grid-cols-2 gap-2">
						<input
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							className="rounded-xl border border-border bg-white px-2.5 py-2 text-sm outline-none"
							required
						/>
						<input
							type="date"
							value={targetDate}
							onChange={(e) => setTargetDate(e.target.value)}
							className="rounded-xl border border-border bg-white px-2.5 py-2 text-sm outline-none"
						/>
					</div>
					<div className="grid grid-cols-7 gap-1.5">
						{DAYS.map((d) => (
							<button
								key={d.v}
								type="button"
								onClick={() => toggleDay(d.v)}
								className={[
									"rounded-full border py-2 font-mono text-xs",
									freq.includes(d.v)
										? "border-foreground bg-foreground text-white"
										: "border-border bg-white text-muted-foreground",
								].join(" ")}
							>
								{d.label.slice(0, 2)}
							</button>
						))}
					</div>
					<button
						type="submit"
						disabled={isPending}
						className="rounded-full bg-primary py-2.5 font-mono text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
					>
						{isPending ? "Creating..." : "Create"}
					</button>
				</form>
			</div>
		</div>
	);
}

function useConvexCreate() {
	const convex = useConvex();
	const [pending, setPending] = useState(false);
	async function mutateAsync(vals: {
		title: string;
		startDate: string;
		targetDate?: string;
		frequency: number[];
	}) {
		setPending(true);
		try {
			await convex.mutation(api.trackers.create, vals);
		} finally {
			setPending(false);
		}
	}
	return { mutateAsync, isPending: pending };
}

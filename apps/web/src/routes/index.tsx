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
import { LogOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import LoginForm from "@/components/login-form";
import PixelScene from "@/components/pixel-scene";
import ThemeToggle from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";
import { useDarkMode } from "@/lib/dark-mode";
import {
	computeCurrentStreak,
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
				<div className="grid min-h-svh place-items-center bg-background font-pixel text-xs text-muted-foreground uppercase">
					Loading…
				</div>
			</AuthLoading>
		</>
	);
}

const DAYS = [
	{ label: "M", value: 1 },
	{ label: "T", value: 2 },
	{ label: "W", value: 3 },
	{ label: "T", value: 4 },
	{ label: "F", value: 5 },
	{ label: "S", value: 6 },
	{ label: "S", value: 0 },
];

const FREQUENCY_PRESETS = [
	{ label: "all days", weekdays: [0, 1, 2, 3, 4, 5, 6] },
	{ label: "weekdays", weekdays: [1, 2, 3, 4, 5] },
	{ label: "weekends", weekdays: [0, 6] },
];

function isSameDaySet(first: number[], second: number[]) {
	return (
		first.length === second.length && first.every((day) => second.includes(day))
	);
}

function Home() {
	const [isDark] = useDarkMode();
	const trackersQuery = useQuery(convexQuery(api.trackers.list, {}));
	const trackers = trackersQuery.data ?? [];
	const [showAdd, setShowAdd] = useState(false);
	const today = useMemo(() => new Date(), []);
	const ensureProfile = useConvexMutation(api.profiles.ensureMyProfile);
	useEffect(() => {
		ensureProfile({}).catch(() => {});
	}, [ensureProfile]);

	const dueToday = trackers.filter((t: any) =>
		(t.frequency ?? []).includes(today.getDay()),
	).length;

	return (
		<div className="min-h-svh">
			<div className="mx-auto max-w-xl px-4 pb-20 md:px-6">
				{/* ── top bar ─────────────────────────────── */}
				<header
					className="reveal flex items-center justify-between py-5"
					style={{ animationDelay: "0ms" }}
				>
					<div className="flex items-center gap-2.5">
						<span className="grid h-9 w-9 place-items-center rounded-md border-2 border-pine bg-lime text-base shadow-[2px_2px_0_0_var(--pine)]">
							🌲
						</span>
						<span className="font-pixel text-sm tracking-wide text-foreground">
							refeat
						</span>
					</div>
					<div className="flex items-center gap-2">
						<ThemeToggle />
						<button
							onClick={() =>
								authClient.signOut({
									fetchOptions: { onSuccess: () => location.reload() },
								})
							}
							className="btn-pixel bg-card !px-3 text-foreground hover:bg-secondary"
							aria-label="Sign out"
						>
							<LogOut className="h-3.5 w-3.5" />
						</button>
						<button
							onClick={() => setShowAdd(true)}
							className="btn-pixel bg-lime text-pine hover:bg-lime-deep"
						>
							+ new quest
						</button>
					</div>
				</header>

				{/* ── sky hero ────────────────────────────── */}
				<section
					className="panel reveal relative overflow-hidden"
					style={{ animationDelay: "60ms" }}
				>
					<PixelScene night={isDark} />
					<div className="absolute inset-0 bg-gradient-to-b from-sky-deep/25 via-transparent to-transparent" />
					<div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
						<div>
							<p className="font-pixel text-[9px] tracking-widest text-chalk uppercase drop-shadow-[1px_1px_0_rgba(34,56,42,0.8)]">
								{today.toLocaleDateString("en-US", {
									weekday: "long",
									month: "long",
									day: "numeric",
								})}
							</p>
							<h1 className="font-display text-6xl leading-[0.9] text-chalk drop-shadow-[2px_2px_0_rgba(34,56,42,0.9)]">
								Your quests
							</h1>
						</div>
						<div className="shrink-0 rounded-md border-2 border-pine bg-paper px-3 py-2 text-center shadow-[3px_3px_0_0_var(--pine)]">
							<p className="font-display text-3xl leading-none text-foreground">
								{dueToday}
							</p>
							<p className="font-pixel text-[8px] tracking-wide text-muted-foreground uppercase">
								due today
							</p>
						</div>
					</div>
				</section>

				{/* ── tracker list ────────────────────────── */}
				<div className="mt-6 grid gap-4">
					{trackersQuery.isLoading &&
						[0, 1].map((i) => (
							<div
								key={i}
								className="panel h-36 animate-pulse !shadow-[4px_4px_0_0_var(--border)]"
							/>
						))}
					{trackers.length === 0 && !trackersQuery.isLoading && (
						<div
							className="panel reveal overflow-hidden"
							style={{ animationDelay: "120ms" }}
						>
							<PixelScene night={isDark} />
							<div className="border-t-2 border-pine p-6 text-center">
								<p className="font-display text-4xl text-foreground">
									Your quest log is empty
								</p>
								<p className="mx-auto mt-2 max-w-[34ch] text-sm text-muted-foreground">
									Accept a quest, come back each day to complete it, and watch
									the streak grow.
								</p>
								<button
									onClick={() => setShowAdd(true)}
									className="btn-pixel mt-5 bg-lime text-pine hover:bg-lime-deep"
								>
									⚔ accept your first quest
								</button>
							</div>
						</div>
					)}
					{trackers.map((t: any, i: number) => (
						<TrackerCard key={t._id} tracker={t} index={i} />
					))}
				</div>
			</div>
			{showAdd && <AddTrackerDialog onClose={() => setShowAdd(false)} />}
		</div>
	);
}

function TrackerCard({ tracker, index }: { tracker: any; index: number }) {
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
			className="panel reveal block p-4"
			style={{ animationDelay: `${140 + index * 70}ms` }}
		>
			<div className="flex items-center justify-between gap-3">
				<h3 className="truncate text-lg font-bold text-foreground">
					{tracker.title}
				</h3>
				<span className="shrink-0 rounded-md border-2 border-pine bg-pine px-2.5 py-1 shadow-[2px_2px_0_0_var(--lime-deep)]">
					<span className="font-display text-xl leading-none text-lime">
						{streak}
					</span>
					<span className="ml-1 font-pixel text-[8px] text-chalk uppercase">
						day streak
					</span>
				</span>
			</div>
			<div className="mt-4 grid grid-cols-14 gap-1">
				{days.map((d) => {
					const status = getDayStatus(d, tracker, set, today);
					const isToday = toISO(d) === toISO(today);
					return (
						<div
							key={toISO(d)}
							className={[
								"relative grid h-7 place-items-center rounded-[3px] border font-mono text-[9px]",
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
	const [frequency, setFrequency] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
	const { mutateAsync, isPending } = useConvexCreate();
	function toggleDay(weekday: number) {
		setFrequency((currentFrequency) =>
			currentFrequency.includes(weekday)
				? currentFrequency.filter((day) => day !== weekday)
				: [...currentFrequency, weekday].sort(),
		);
	}
	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!title.trim()) return;
		if (frequency.length === 0) return alert("Pick at least one day");
		await mutateAsync({
			title: title.trim(),
			startDate,
			targetDate: targetDate || undefined,
			frequency,
		});
		onClose();
	}
	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-pine/50 p-0 backdrop-blur-[2px] md:items-center md:p-4"
			onClick={onClose}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				className="panel reveal w-full max-w-md !rounded-b-none border-b-0 p-5 md:!rounded-b-lg md:border-b-2"
			>
				<div className="flex items-center justify-between">
					<h3 className="font-display text-4xl leading-none text-foreground">
						New quest
					</h3>
					<button
						onClick={onClose}
						className="grid h-7 w-7 place-items-center rounded-[3px] border-2 border-pine bg-card font-pixel text-[10px] text-muted-foreground shadow-[2px_2px_0_0_var(--pine)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
					>
						✕
					</button>
				</div>
				<form onSubmit={handleSubmit} className="mt-4 grid gap-3">
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="e.g. Read 10 pages"
						className="w-full rounded-md border-2 border-pine bg-background px-3 py-2.5 text-sm font-medium outline-none placeholder:text-muted-foreground/50 focus:bg-card"
						required
						maxLength={48}
					/>
					<div className="grid grid-cols-2 gap-2">
						<label className="grid gap-1">
							<span className="font-pixel text-[9px] tracking-wide text-muted-foreground uppercase">
								start
							</span>
							<input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								className="rounded-md border-2 border-pine bg-background px-2.5 py-2 font-mono text-[11px] outline-none"
								required
							/>
						</label>
						<label className="grid gap-1">
							<span className="font-pixel text-[9px] tracking-wide text-muted-foreground uppercase">
								target (optional)
							</span>
							<input
								type="date"
								value={targetDate}
								onChange={(e) => setTargetDate(e.target.value)}
								className="rounded-md border-2 border-pine bg-background px-2.5 py-2 font-mono text-[11px] outline-none"
							/>
						</label>
					</div>
					<div className="grid gap-1">
						<span className="font-pixel text-[9px] tracking-wide text-muted-foreground uppercase">
							repeat on
						</span>
						<div className="flex gap-1.5">
							{FREQUENCY_PRESETS.map((preset) => {
								const isActivePreset = isSameDaySet(frequency, preset.weekdays);
								return (
									<button
										key={preset.label}
										type="button"
										onClick={() => setFrequency(preset.weekdays)}
										className={[
											"flex-1 rounded-[3px] border-2 py-1.5 font-pixel text-[9px] tracking-wide uppercase",
											isActivePreset
												? "border-pine bg-forest text-primary-foreground shadow-[2px_2px_0_0_var(--lime-deep)]"
												: "border-input bg-card text-muted-foreground hover:bg-secondary",
										].join(" ")}
									>
										{preset.label}
									</button>
								);
							})}
						</div>
						<div className="grid grid-cols-7 gap-1.5">
							{DAYS.map((day, index) => (
								<button
									key={index}
									type="button"
									onClick={() => toggleDay(day.value)}
									className={[
										"grid h-9 place-items-center rounded-[3px] border-2 font-pixel text-[10px]",
										frequency.includes(day.value)
											? "tile border-pine bg-forest text-primary-foreground"
											: "border-input bg-card text-muted-foreground hover:bg-secondary",
									].join(" ")}
								>
									{day.label}
								</button>
							))}
						</div>
					</div>
					<button
						type="submit"
						disabled={isPending}
						className="btn-pixel mt-1 w-full bg-lime text-sm text-pine hover:bg-lime-deep"
					>
						{isPending ? "accepting…" : "⚔ accept quest"}
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

import { convexQuery } from "@convex-dev/react-query";
import { api } from "@refeat/backend/convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import { useMemo, useState } from "react";

import {
  computeCurrentStreak,
  computeMonthStats,
  fromISO,
  getDayStatus,
  getMonthDays,
  toISO,
} from "@/lib/dates";

export const Route = createFileRoute("/")({
  component: Home,
});

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

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-xl px-4 pb-10 md:px-6">
        {/* header - only logo + action, no nav fluff */}
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">🌲</span>
            <span className="text-sm font-semibold tracking-tight text-foreground font-display">
              refeat
            </span>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground font-mono transition hover:bg-primary/90"
          >
            + New
          </button>
        </header>

        {/* minimal hero — just context, no marketing */}
        <div className="pt-1">
          <h1 className="text-2xl font-bold leading-none tracking-tight text-foreground font-display">
            Your habits
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground font-mono">
            {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}{" "}
            • {trackers.length} {trackers.length === 1 ? "tracker" : "trackers"}
          </p>
        </div>

        {/* legend — one line, to the point */}
        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground font-mono">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-sage" /> done
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> missed
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-card border border-border" /> rest
          </span>
          <span className="ml-auto hidden text-muted-foreground md:inline">
            tap square to toggle
          </span>
        </div>

        {/* trackers */}
        <div className="mt-5 grid gap-3">
          {trackersQuery.isLoading &&
            [0, 1].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-secondary" />
            ))}

          {trackers.length === 0 && !trackersQuery.isLoading && (
            <div className="rounded-xl border border-dashed border-border/60 bg-card/70 p-6 text-center">
              <p className="text-sm font-semibold text-foreground font-display">No habits yet</p>
              <p className="mx-auto mt-1 max-w-[26ch] text-xs text-muted-foreground font-mono">
                Add a habit to start tracking.
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="mt-3 rounded-full bg-primary px-4 py-1.5 text-xs text-white font-mono"
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
  const stats = useMemo(
    () => computeMonthStats(days, tracker, set, today),
    [days, tracker, set, today],
  );
  const streak = useMemo(() => computeCurrentStreak(tracker, set, today), [tracker, set, today]);
  const pct = stats.required ? Math.round((stats.done / stats.required) * 100) : 0;

  return (
    <Link
      to="/trackers/$id"
      params={{ id: tracker._id }}
      className="block rounded-xl border border-border/40 bg-card p-3.5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate pr-2 text-sm font-bold leading-none text-foreground font-display">
          {tracker.title}
        </h3>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-1 text-xs font-medium text-foreground font-mono">
          {streak} streak • {stats.done}/{stats.required}
        </span>
      </div>

      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-sage" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-2.5 grid grid-cols-7 gap-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((w, i) => (
          <div key={i} className="text-center text-xs text-muted-foreground/60 font-mono">
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
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((d, idx) => {
              if (!d) return <div key={idx} className="aspect-square" />;
              const status = getDayStatus(d, tracker, set, today);
              const isToday = toISO(d) === toISO(today);
              return (
                <div
                  key={idx}
                  className={[
                    "flex aspect-square items-center justify-center rounded-lg border text-xs font-mono",
                    status === "done"
                      ? "border-sage bg-sage text-white"
                      : status === "failed"
                        ? "border-primary bg-primary text-white"
                        : status === "not_required"
                          ? "border-secondary bg-secondary text-muted-foreground/60"
                          : "border-border/40 bg-white text-muted-foreground",
                    isToday ? "ring-1 ring-primary/30" : "",
                  ].join(" ")}
                >
                  {d.getDate()}
                </div>
              );
            })}
          </div>
        );
      })()}
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
    setFreq((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v].sort()));
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
          <h3 className="text-sm font-bold text-foreground font-display">New habit</h3>
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
              placeholder="Target"
              className="rounded-xl border border-border bg-white px-2.5 py-2 text-sm outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map((d) => (
              <button
                key={d.v}
                type="button"
                onClick={() => toggleDay(d.v)}
                className={[
                  "rounded-full border px-2.5 py-1.5 text-xs font-mono",
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
            className="rounded-full bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 font-mono"
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

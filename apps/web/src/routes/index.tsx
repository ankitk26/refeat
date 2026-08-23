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
  const monthLabel = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="min-h-svh">
      {/* Top Navigation */}
      <header className="sticky top-0 z-20 border-b border-[#E8E0D5] bg-[#F6F1E7]/90 backdrop-blur">
        <div className="mx-auto flex max-w-[480px] items-center justify-between px-4 py-3 md:max-w-[640px]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A1A18] text-[11px] font-bold tracking-widest text-white">
              rf
            </div>
            <div>
              <h1
                className="text-[17px] font-bold leading-none tracking-tight text-[#1A1A18]"
                style={{ fontFamily: "Fraunces, serif" }}
              >
                refeat<span className="text-[#C44536]">.</span>
              </h1>
              <p className="font-mono text-[10px] tracking-widest text-[#6B6560]">
                MINIMAL HABIT LEDGER
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1A18] px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-black active:scale-95"
          >
            <span className="text-sm leading-none">+</span> New
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[480px] px-4 pb-12 pt-5 md:max-w-[640px]">
        {/* Hero */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] tracking-[0.18em] text-[#9A9590]">
                TODAY —{" "}
                {today
                  .toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                  .toUpperCase()}
              </p>
              <h2
                className="mt-1 text-[28px] font-bold leading-none tracking-tight text-[#1A1A18]"
                style={{ fontFamily: "Fraunces, serif" }}
              >
                Your habits,
                <br />
                <span className="font-normal italic">on paper.</span>
              </h2>
            </div>
            <div className="hidden shrink-0 flex-col items-end gap-1 md:flex">
              <div className="rounded-full border border-[#E8E0D5] bg-white px-2.5 py-1 font-mono text-[10px] text-[#6B6560]">
                {trackers.length} TRACKERS
              </div>
              <div className="rounded-full bg-[#2D4A3A] px-2.5 py-1 font-mono text-[10px] font-medium text-white">
                {monthLabel}
              </div>
            </div>
          </div>

          {/* Month strip */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E0D5] bg-white px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[#2D4A3A]" />
              <span className="font-mono text-[11px] font-medium tracking-widest text-[#1A1A18]">
                {monthLabel.toUpperCase()}
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#9A9590] hidden sm:inline">
              • Tap a square to mark done
            </span>
            <div className="ml-auto flex items-center gap-1.5 font-mono text-[10px]">
              <span className="inline-flex items-center gap-1">
                <i className="h-2.5 w-2.5 rounded-sm bg-[#2D4A3A] inline-block" /> done
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="h-2.5 w-2.5 rounded-sm bg-[#C44536] inline-block" /> miss
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="h-2.5 w-2.5 rounded-sm bg-[#EAE6DF] inline-block border border-[#E8E0D5]" />{" "}
                off
              </span>
            </div>
          </div>
        </div>

        {/* Empty */}
        {trackers.length === 0 && !trackersQuery.isLoading && (
          <div className="rounded-[20px] border border-dashed border-[#D6CFBC] bg-white/60 p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F6F1E7] text-lg">
              ✎
            </div>
            <p
              className="text-sm font-medium text-[#1A1A18]"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              No trackers yet
            </p>
            <p className="mx-auto mt-1 max-w-[28ch] text-xs leading-relaxed text-[#6B6560]">
              Create your first habit. Pick a title, start date, and the days you want to show up.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 rounded-full bg-[#1A1A18] px-4 py-2 text-xs font-medium text-white"
            >
              Create tracker
            </button>
          </div>
        )}

        {trackersQuery.isLoading && (
          <div className="grid gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-[20px] bg-[#EDE6D6]" />
            ))}
          </div>
        )}

        {/* Tracker Cards */}
        <div className="grid gap-4">
          {trackers.map((t: any) => (
            <TrackerCard key={t._id} tracker={t} />
          ))}
        </div>

        {/* Footer note */}
        <p className="mx-auto mt-8 max-w-[36ch] text-center font-mono text-[10px] leading-relaxed tracking-wide text-[#9A9590]">
          REFEAT IS A PAPER-LEDGER HABIT TRACKER. GREEN = DONE, TERRACOTTA = MISSED, STONE = REST
          DAY. TAP TO CORRECT.
        </p>
      </main>

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

  // frequency label
  const freqLabel = useMemo(() => {
    if (tracker.frequency.length === 7) return "Every day";
    if (
      tracker.frequency.length === 5 &&
      [1, 2, 3, 4, 5].every((d) => tracker.frequency.includes(d))
    )
      return "Weekdays";
    const names: Record<number, string> = {
      0: "Sun",
      1: "Mon",
      2: "Tue",
      3: "Wed",
      4: "Thu",
      5: "Fri",
      6: "Sat",
    };
    return tracker.frequency.map((d: number) => names[d]).join(" · ");
  }, [tracker.frequency]);

  return (
    <Link
      to="/trackers/$id"
      params={{ id: tracker._id }}
      className="group block rounded-[20px] border border-[#E8E0D5] bg-white p-4 shadow-[0_1px_2px_rgba(26,26,24,0.04),0_8px_24px_rgba(26,26,24,0.04)] transition hover:shadow-[0_4px_16px_rgba(26,26,24,0.08)]"
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className="truncate text-[17px] font-bold leading-tight tracking-tight text-[#1A1A18]"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            {tracker.title}
          </h3>
          <p className="mt-0.5 line-clamp-1 font-mono text-[11px] text-[#6B6560]">
            {freqLabel} • started{" "}
            {fromISO(tracker.startDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
            {tracker.targetDate
              ? ` • until ${fromISO(tracker.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F6F1E7] px-2 py-1 font-mono text-[10px] font-medium tracking-wide text-[#1A1A18]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2D4A3A]" /> {streak} streak
          </span>
          <span className="hidden rounded-full border border-[#E8E0D5] bg-white px-2 py-1 font-mono text-[10px] text-[#6B6560] sm:inline-flex">
            {stats.done}/{stats.required}
          </span>
        </div>
      </div>

      {/* Progress thin */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#F0EBE0]">
        <div
          className="h-full rounded-full bg-[#2D4A3A] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between font-mono text-[10px] tracking-wide text-[#9A9590]">
        <span>{pct}% this month</span>
        <span className="sm:hidden">
          {stats.done}/{stats.required} done
        </span>
        <span className="hidden sm:inline">
          {stats.failed} missed • {stats.required - stats.done - stats.failed} left
        </span>
      </div>

      {/* Day grid */}
      <div className="mt-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.14em] text-[#9A9590]">
            {new Date().toLocaleDateString("en-US", { month: "long" }).toUpperCase()}
          </span>
          <span className="font-mono text-[10px] text-[#9A9590]">{days.length} days</span>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1.5">
          {["M", "T", "W", "T", "F", "S", "S"].map((w, i) => (
            <div key={i} className="text-center font-mono text-[10px] tracking-wide text-[#B8B2A8]">
              {w}
            </div>
          ))}
        </div>

        {/* Calendar squares - with offset for first weekday (Monday-start) */}
        {(() => {
          const first = new Date(year, month, 1);
          // convert Sunday 0 -> 6, Mon 1 ->0 etc for Monday start
          const offset = (first.getDay() + 6) % 7;
          const cells: (Date | null)[] = [];
          for (let i = 0; i < offset; i++) cells.push(null);
          for (const d of days) cells.push(d);
          // pad to complete rows
          while (cells.length % 7 !== 0) cells.push(null);

          return (
            <div className="mt-1 grid grid-cols-7 gap-1.5">
              {cells.map((d, idx) => {
                if (!d) return <div key={idx} className="aspect-square" />;
                const status = getDayStatus(d, tracker, set, today);
                const isToday = toISO(d) === toISO(today);
                return (
                  <div
                    key={idx}
                    className={[
                      "relative flex aspect-square items-center justify-center rounded-[9px] border text-[11px] font-medium transition",
                      status === "done"
                        ? "border-[#2D4A3A] bg-[#2D4A3A] text-white shadow-sm"
                        : status === "failed"
                          ? "border-[#C44536] bg-[#C44536] text-white"
                          : status === "not_required"
                            ? "border-[#F0EBE0] bg-[#F6F1E7] text-[#B8B2A8]"
                            : status === "pending"
                              ? "border-[#1A1A18] bg-white text-[#1A1A18] ring-1 ring-[#1A1A18]/10"
                              : "border-[#E8E0D5] bg-white text-[#6B6560]",
                      isToday ? "ring-2 ring-[#C9A96A] ring-offset-1 ring-offset-white" : "",
                    ].join(" ")}
                  >
                    <span className="font-mono text-[11px]">{d.getDate()}</span>
                    {status === "done" && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-white text-[8px] text-[#2D4A3A]">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#F0EBE0] pt-3">
        <span className="font-mono text-[10px] tracking-wide text-[#9A9590]">TAP TO OPEN →</span>
        <span className="font-mono text-[10px] text-[#9A9590] group-hover:text-[#1A1A18]">
          details & edit
        </span>
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#1A1A18]/30 backdrop-blur-sm p-0 md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] rounded-t-[24px] border border-[#E8E0D5] bg-[#FFFCF5] p-5 shadow-2xl md:rounded-[24px]"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E8E0D5] md:hidden" />
        <div className="flex items-start justify-between">
          <div>
            <h3
              className="text-lg font-bold tracking-tight text-[#1A1A18]"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              New tracker
            </h3>
            <p className="font-mono text-[11px] tracking-wide text-[#6B6560]">
              A habit worth repeating
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E0D5] bg-white text-[#6B6560] hover:text-[#1A1A18]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
          <label className="grid gap-1.5">
            <span className="font-mono text-[10px] tracking-[0.14em] text-[#9A9590]">TITLE</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning run, Read 20 pages"
              className="w-full rounded-xl border border-[#E8E0D5] bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[#B8B2A8] focus:border-[#1A1A18] focus:ring-1 focus:ring-[#1A1A18]/10"
              required
              maxLength={48}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5">
              <span className="font-mono text-[10px] tracking-[0.14em] text-[#9A9590]">
                START DATE
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-[#E8E0D5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1A1A18]"
                required
              />
            </label>
            <label className="grid gap-1.5">
              <span className="font-mono text-[10px] tracking-[0.14em] text-[#9A9590]">
                TARGET (OPTIONAL)
              </span>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-xl border border-[#E8E0D5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1A1A18]"
              />
            </label>
          </div>

          <div className="grid gap-1.5">
            <span className="font-mono text-[10px] tracking-[0.14em] text-[#9A9590]">
              REPEAT ON
            </span>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS.map((d) => {
                const active = freq.includes(d.v);
                return (
                  <button
                    key={d.v}
                    type="button"
                    onClick={() => toggleDay(d.v)}
                    className={[
                      "rounded-xl border py-2.5 text-xs font-medium transition",
                      active
                        ? "border-[#1A1A18] bg-[#1A1A18] text-white"
                        : "border-[#E8E0D5] bg-white text-[#6B6560] hover:border-[#1A1A18]/20",
                    ].join(" ")}
                  >
                    {d.label.slice(0, 2)}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setFreq([1, 2, 3, 4, 5, 6, 0])}
                className="rounded-full bg-[#F0EBE0] px-2.5 py-1 font-mono text-[10px]"
              >
                Every day
              </button>
              <button
                type="button"
                onClick={() => setFreq([1, 2, 3, 4, 5])}
                className="rounded-full bg-[#F0EBE0] px-2.5 py-1 font-mono text-[10px]"
              >
                Weekdays
              </button>
              <button
                type="button"
                onClick={() => setFreq([6, 0])}
                className="rounded-full bg-[#F0EBE0] px-2.5 py-1 font-mono text-[10px]"
              >
                Weekend
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-[#1A1A18] px-4 py-3 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create tracker →"}
          </button>

          <p className="text-center font-mono text-[10px] text-[#9A9590]">
            You can edit this later. Green = done, red = missed.
          </p>
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
      // @ts-ignore
      await convex.mutation(api.trackers.create, vals);
    } finally {
      setPending(false);
    }
  }
  return { mutateAsync, isPending: pending };
}

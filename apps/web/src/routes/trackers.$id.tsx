import { convexQuery } from "@convex-dev/react-query";
import { api } from "@refeat/backend/convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import { useMemo, useState } from "react";

import { fromISO, getDayStatus, getMonthDays, toISO, WEEKDAYS_SHORT } from "@/lib/dates";

export const Route = createFileRoute("/trackers/$id")({
  component: TrackerDetail,
});

function TrackerDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const convex = useConvex();

  const trackerQuery = useQuery(convexQuery(api.trackers.get, { id: id as any }));
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
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const canGoNext = useMemo(() => {
    const next = new Date(year, month + 1, 1);
    // allow future up to next month? keep limited to current month +1
    return next <= new Date(today.getFullYear(), today.getMonth() + 2, 1);
  }, [year, month, today]);

  if (trackerQuery.isLoading) {
    return (
      <div className="mx-auto max-w-[480px] p-4 md:max-w-[640px]">
        <div className="h-64 animate-pulse rounded-[20px] bg-[#EDE6D6]" />
      </div>
    );
  }
  if (!tracker) {
    return (
      <div className="mx-auto max-w-[480px] p-6 text-center md:max-w-[640px]">
        <p className="text-sm text-[#6B6560]">Tracker not found</p>
        <Link
          to="/"
          className="mt-2 inline-block rounded-full bg-[#1A1A18] px-4 py-2 text-xs text-white"
        >
          Back home
        </Link>
      </div>
    );
  }

  const doneCount = days.filter((d) => getDayStatus(d, tracker, set, today) === "done").length;
  const failedCount = days.filter((d) => getDayStatus(d, tracker, set, today) === "failed").length;
  const requiredCount = days.filter((d) => {
    const s = getDayStatus(d, tracker, set, today);
    return s === "done" || s === "failed" || s === "pending" || s === "future";
  }).length;

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

  const freqNames: Record<number, string> = {
    0: "Sun",
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
  };
  const freqLabel =
    tracker.frequency.length === 7
      ? "Every day"
      : tracker.frequency
          .slice()
          .sort((a: number, b: number) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
          .map((d: number) => freqNames[d])
          .join(" · ");

  async function toggle(date: string) {
    // prevent toggling future far beyond today? allow up to today
    const d = fromISO(date);
    const isoToday = toISO(today);
    if (date > isoToday) return; // no future
    // check if required
    const status = getDayStatus(d, tracker!, set, today);
    if (status === "not_required") return;
    await convex.mutation(api.completions.toggle, { trackerId: id as any, date });
  }

  async function remove() {
    if (!confirm("Delete this tracker? This cannot be undone.")) return;
    await convex.mutation(api.trackers.remove, { id: id as any });
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b border-[#E8E0D5] bg-[#F6F1E7]/90 backdrop-blur">
        <div className="mx-auto flex max-w-[480px] items-center justify-between px-4 py-3 md:max-w-[640px]">
          <Link to="/" className="inline-flex items-center gap-2 text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E8E0D5] bg-white text-xs">
              ←
            </span>
            <span className="font-mono text-[11px] tracking-widest text-[#6B6560]">BACK</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={remove}
              className="rounded-full border border-[#E8E0D5] bg-white px-3 py-1.5 font-mono text-[11px] text-[#C44536] hover:bg-[#FBE9E6]"
            >
              Delete
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[480px] px-4 pb-10 pt-5 md:max-w-[640px]">
        {/* Title block */}
        <div className="rounded-[24px] border border-[#E8E0D5] bg-white p-5 shadow-[0_8px_24px_rgba(26,26,24,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1
                className="text-[22px] font-bold leading-tight tracking-tight text-[#1A1A18]"
                style={{ fontFamily: "Fraunces, serif" }}
              >
                {tracker.title}
              </h1>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-[#6B6560]">
                {freqLabel} • started{" "}
                {fromISO(tracker.startDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {tracker.targetDate
                  ? ` • target ${fromISO(tracker.targetDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
                  : ""}
              </p>
            </div>
            <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-[#F6F1E7] text-lg md:flex">
              ◐
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="STREAK" value={`${streak}d`} sub="current" accent />
            <Stat label="DONE" value={`${doneCount}`} sub={`/${requiredCount}`} />
            <Stat
              label="MISSED"
              value={`${failedCount}`}
              sub="this month"
              danger={failedCount > 0}
            />
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between font-mono text-[10px] tracking-wide text-[#9A9590]">
              <span>PROGRESS</span>
              <span>{requiredCount ? Math.round((doneCount / requiredCount) * 100) : 0}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#F0EBE0]">
              <div
                className="h-full rounded-full bg-[#2D4A3A]"
                style={{ width: `${requiredCount ? (doneCount / requiredCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="mt-5 rounded-[20px] border border-[#E8E0D5] bg-[#FFFCF5] p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E0D5] bg-white text-sm hover:bg-[#F6F1E7]"
            >
              ‹
            </button>
            <div className="text-center">
              <div className="font-mono text-[10px] tracking-[0.16em] text-[#9A9590]">
                MONTH VIEW
              </div>
              <div
                className="text-[16px] font-bold tracking-tight text-[#1A1A18]"
                style={{ fontFamily: "Fraunces, serif" }}
              >
                {monthLabel}
              </div>
            </div>
            <button
              onClick={() => canGoNext && setCursor(new Date(year, month + 1, 1))}
              disabled={!canGoNext}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E0D5] bg-white text-sm hover:bg-[#F6F1E7] disabled:opacity-40"
            >
              ›
            </button>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-center gap-3 font-mono text-[10px]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[5px] bg-[#2D4A3A] border border-[#2D4A3A]" /> done
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[5px] bg-[#C44536] border border-[#C44536]" /> failed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[5px] bg-[#F6F1E7] border border-[#E8E0D5]" /> rest
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[5px] bg-white border border-[#1A1A18]" /> today
            </span>
          </div>

          {/* Weekday header */}
          <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
            {WEEKDAYS_SHORT.map((w, i) => (
              <div key={i} className="font-mono text-[10px] tracking-wide text-[#B8B2A8]">
                {w}
              </div>
            ))}
          </div>

          {/* Grid */}
          {(() => {
            const first = new Date(year, month, 1);
            // Monday-start offset
            const offset = (first.getDay() + 6) % 7;
            const cells: (Date | null)[] = [];
            for (let i = 0; i < offset; i++) cells.push(null);
            for (const d of days) cells.push(d);
            while (cells.length % 7 !== 0) cells.push(null);

            return (
              <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                {cells.map((d, idx) => {
                  if (!d) return <div key={idx} className="aspect-square" />;
                  const iso = toISO(d);
                  const status = getDayStatus(d, tracker, set, today);
                  const isToday = iso === toISO(today);
                  const isClickable = status !== "not_required" && iso <= toISO(today);
                  return (
                    <button
                      key={idx}
                      disabled={!isClickable}
                      onClick={() => toggle(iso)}
                      className={[
                        "group relative flex aspect-square flex-col items-center justify-center rounded-[12px] border text-center transition active:scale-95",
                        status === "done"
                          ? "border-[#2D4A3A] bg-[#2D4A3A] text-white shadow-sm hover:brightness-110"
                          : status === "failed"
                            ? "border-[#C44536] bg-[#C44536] text-white hover:brightness-110"
                            : status === "not_required"
                              ? "border-[#F0EBE0] bg-[#F6F1E7] text-[#B8B2A8] cursor-default"
                              : status === "pending"
                                ? "border-[#1A1A18] bg-white text-[#1A1A18] hover:bg-[#1A1A18] hover:text-white"
                                : "border-[#E8E0D5] bg-white text-[#6B6560] cursor-default",
                        isToday ? "ring-2 ring-[#C9A96A] ring-offset-1 ring-offset-[#FFFCF5]" : "",
                        isClickable ? "cursor-pointer" : "cursor-default",
                      ].join(" ")}
                      title={`${iso} — ${status}${isClickable ? " (tap to toggle)" : ""}`}
                    >
                      <span className="font-mono text-[12px] font-medium leading-none">
                        {d.getDate()}
                      </span>
                      {status === "done" ? (
                        <span className="mt-0.5 text-[9px] leading-none opacity-90">✓</span>
                      ) : status === "failed" ? (
                        <span className="mt-0.5 text-[9px] leading-none opacity-90">✕</span>
                      ) : status === "not_required" ? (
                        <span className="mt-0.5 text-[7px] tracking-widest opacity-60">OFF</span>
                      ) : (
                        <span className="mt-0.5 text-[7px] tracking-widest opacity-60">
                          {isToday ? "TODAY" : ""}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })()}

          <p className="mt-4 text-center font-mono text-[10px] leading-relaxed tracking-wide text-[#9A9590]">
            TAP ANY COLORED SQUARE TO MARK DONE / UNDO. GREY = REST DAY.
          </p>
        </div>

        {/* Today quick action */}
        <div className="mt-4 flex gap-2">
          {(() => {
            const isoToday = toISO(today);
            const statusToday = getDayStatus(today, tracker, set, today);
            if (statusToday === "not_required") {
              return (
                <div className="flex w-full items-center justify-center rounded-full border border-dashed border-[#D6CFBC] bg-white px-4 py-3 font-mono text-xs text-[#9A9590]">
                  Today is a rest day — no action needed
                </div>
              );
            }
            if (statusToday === "done") {
              return (
                <button
                  onClick={() => toggle(isoToday)}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-[#2D4A3A] bg-[#2D4A3A] px-4 py-3 text-sm font-medium text-white"
                >
                  ✓ Done today — tap to undo
                </button>
              );
            }
            if (statusToday === "failed" || statusToday === "pending") {
              return (
                <button
                  onClick={() => toggle(isoToday)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1A1A18] px-4 py-3 text-sm font-medium text-white hover:bg-black"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-[#1A1A18]">
                    ✓
                  </span>
                  Mark today as done
                </button>
              );
            }
            return (
              <div className="flex w-full items-center justify-center rounded-full border border-[#E8E0D5] bg-white px-4 py-3 font-mono text-xs text-[#9A9590]">
                Future date — check back then
              </div>
            );
          })()}
        </div>

        <p className="mt-6 text-center font-mono text-[10px] leading-relaxed text-[#9A9590]">
          TIP: If you missed yesterday, open this month and tap the red square to correct it.
        </p>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
  danger,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border px-3 py-3 text-center",
        accent
          ? "border-[#2D4A3A] bg-[#2D4A3A] text-white"
          : danger
            ? "border-[#FBE9E6] bg-[#FBE9E6] text-[#C44536]"
            : "border-[#E8E0D5] bg-[#F6F1E7] text-[#1A1A18]",
      ].join(" ")}
    >
      <div
        className={[
          "font-mono text-[9px] tracking-[0.14em]",
          accent ? "text-white/70" : danger ? "text-[#C44536]/70" : "text-[#9A9590]",
        ].join(" ")}
      >
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline justify-center gap-1">
        <span
          className="text-[18px] font-bold leading-none"
          style={{ fontFamily: "Fraunces, serif" }}
        >
          {value}
        </span>
        <span
          className={["font-mono text-[10px]", accent ? "text-white/70" : "text-[#9A9590]"].join(
            " ",
          )}
        >
          {sub}
        </span>
      </div>
    </div>
  );
}

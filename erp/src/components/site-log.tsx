import Link from "next/link";
import { saveSiteLog } from "@/app/actions/labor";
import { fmtDate, php } from "@/lib/format";
import type { Attendance, DailyLog, Worker } from "@/lib/types";
import { ActionForm, SubmitButton } from "./forms";
import { Badge, Card, CardHeader, EmptyState, Field, Input, LinkButton, Select, Textarea, cx } from "./ui";

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export type DaySummary = { date: string; workers: number; amount: number; hasNotes: boolean };

export function SiteLogPanel({
  projectId,
  date,
  workers,
  attendance,
  log,
  recent,
  unpaidLabor,
}: {
  projectId: string;
  date: string;
  /** Active workers, plus anyone logged on this day. */
  workers: Worker[];
  attendance: Attendance[];
  log: DailyLog | null;
  recent: DaySummary[];
  unpaidLabor: number;
}) {
  const byWorker = new Map(attendance.map((a) => [a.worker_id, a]));
  const dayTotal = attendance.reduce((s, a) => s + Number(a.amount), 0);
  const base = `/projects/${projectId}?tab=log`;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader
          title={`Site log — ${fmtDate(date)}`}
          sub={`${attendance.length} on site · ${php(dayTotal)} labor this day`}
        />
        <div className="flex items-center gap-1 border-b border-line px-4 py-2 sm:px-5">
              <Link href={`${base}&date=${addDays(date, -1)}`} scroll={false} className="rounded-md px-2 py-1 text-sm text-muted hover:bg-canvas" aria-label="Previous day">
                ←
              </Link>
              <form className="contents">
                <input type="hidden" name="tab" value="log" />
                <input
                  type="date"
                  name="date"
                  defaultValue={date}
                  aria-label="Date"
                  className="rounded-md border border-line bg-surface px-2 py-1 text-xs text-ink"
                />
                <button className="rounded-md px-2 py-1 text-xs font-medium text-brand hover:bg-brand-soft">Go</button>
              </form>
              <Link href={`${base}&date=${addDays(date, 1)}`} scroll={false} className="rounded-md px-2 py-1 text-sm text-muted hover:bg-canvas" aria-label="Next day">
                →
              </Link>
            </div>
        {workers.length === 0 ? (
          <EmptyState title="No workers yet">
            Add your crew and their daily rates first.
            <div className="mt-3">
              <LinkButton href="/labor">Add workers</LinkButton>
            </div>
          </EmptyState>
        ) : (
          <ActionForm action={saveSiteLog.bind(null, projectId, date)} resetOnSuccess={false} key={date}>
            <ul className="divide-y divide-line">
              {workers.map((w) => {
                const a = byWorker.get(w.id);
                const locked = Boolean(a?.payroll_run_id);
                return (
                  <li key={w.id} className="grid grid-cols-2 items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:grid-cols-[1fr_8rem_6rem_6rem] sm:px-5">
                    <div className="col-span-2 min-w-0 sm:col-span-1">
                      <p className="truncate text-sm font-medium text-ink">{w.name}</p>
                      <p className="truncate text-xs text-muted">
                        {[w.position, `${php(a?.daily_rate ?? w.daily_rate)}/day`].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {locked ? (
                      <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-3">
                        <span className="text-xs text-muted">
                          {Number(a!.days) === 1 ? "Full day" : "Half day"}
                          {Number(a!.ot_hours) > 0 && ` + ${Number(a!.ot_hours)}h OT`}
                        </span>
                        <Badge tone="gain">Paid</Badge>
                        <span className="w-20 text-right text-sm tabular-nums text-ink">{php(a!.amount)}</span>
                      </div>
                    ) : (
                      <>
                        <input type="hidden" name="worker_id" value={w.id} />
                        <Select name={`days_${w.id}`} defaultValue={a ? String(Number(a.days)) : ""} aria-label={`${w.name} attendance`} className="py-1.5">
                          <option value="">Absent</option>
                          <option value="0.5">Half day</option>
                          <option value="1">Full day</option>
                        </Select>
                        <Input
                          name={`ot_${w.id}`}
                          inputMode="decimal"
                          placeholder="OT hrs"
                          defaultValue={a && Number(a.ot_hours) > 0 ? String(Number(a.ot_hours)) : ""}
                          aria-label={`${w.name} overtime hours`}
                          className="py-1.5"
                        />
                        <span className="hidden text-right text-sm tabular-nums text-muted sm:block">{a ? php(a.amount) : "—"}</span>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="grid gap-3 border-t border-line px-4 py-4 sm:grid-cols-2 sm:px-5">
              <Field label="Weather">
                <Input name="weather" defaultValue={log?.weather ?? ""} placeholder="Sunny / rain in the afternoon" />
              </Field>
              <div className="hidden sm:block" />
              <Field label="Work done today" className="sm:col-span-2">
                <Textarea name="work_done" rows={3} defaultValue={log?.work_done ?? ""} placeholder="Poured 2F slab, grid B–D. Started CHB laying, east wall." />
              </Field>
              <Field label="Issues / delays / visitors" className="sm:col-span-2">
                <Textarea name="issues" rows={2} defaultValue={log?.issues ?? ""} placeholder="Cement delivery late by 3 hours. Client visited 10am." />
              </Field>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
              <p className="text-xs text-muted">Overtime is paid at 125% of the hourly rate (daily rate ÷ 8).</p>
              <SubmitButton>Save day</SubmitButton>
            </div>
          </ActionForm>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Recent days"
          sub={unpaidLabor > 0 ? `${php(unpaidLabor)} of labor not yet in a payroll` : "All logged labor is paid"}
          action={
            unpaidLabor > 0 ? (
              <Link href={`/labor/payroll/new?project=${projectId}`} className="whitespace-nowrap text-xs font-medium text-brand hover:underline">
                Run payroll
              </Link>
            ) : undefined
          }
        />
        {recent.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-muted">Nothing logged yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((d) => (
              <li key={d.date}>
                <Link
                  href={`${base}&date=${d.date}`}
                  scroll={false}
                  className={cx("flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-canvas/60 sm:px-5", d.date === date && "bg-brand-soft/60")}
                >
                  <span className="text-ink">
                    {fmtDate(d.date)}
                    {d.hasNotes && <span className="ml-1.5 text-xs text-muted">· notes</span>}
                  </span>
                  <span className="text-xs tabular-nums text-muted">
                    {d.workers} on site · <span className="text-ink">{php(d.amount)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

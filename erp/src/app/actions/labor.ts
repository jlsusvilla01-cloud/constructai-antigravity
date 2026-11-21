"use server";

import { redirect } from "next/navigation";
import { dbMessage, fail, num, ok, optDate, optStr, refresh, str } from "@/lib/formdata";
import { getSession } from "@/lib/org";
import type { ActionState } from "@/lib/types";

// ─── Workers ─────────────────────────────────────────────────────────────────

function readWorker(fd: FormData) {
  const name = str(fd, "name");
  const rate = num(str(fd, "daily_rate"));
  if (!name) return { error: "Enter the worker’s name." } as const;
  if (!(rate >= 0)) return { error: "Enter the daily rate (numbers only)." } as const;
  return { values: { name, position: optStr(fd, "position"), phone: optStr(fd, "phone"), daily_rate: rate } } as const;
}

export async function addWorker(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId } = await getSession();
  const parsed = readWorker(fd);
  if ("error" in parsed) return fail(parsed.error!);
  const { error } = await supabase.from("workers").insert({ ...parsed.values, org_id: orgId });
  if (error) return fail(error.code === "23505" ? "You already have a worker with that name." : "Couldn’t save. " + dbMessage(error));
  refresh();
  return ok();
}

export async function updateWorker(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await getSession();
  const parsed = readWorker(fd);
  if ("error" in parsed) return fail(parsed.error!);
  const { error } = await supabase.from("workers").update(parsed.values).eq("id", id);
  if (error) return fail(error.code === "23505" ? "You already have a worker with that name." : "Couldn’t save. " + dbMessage(error));
  refresh();
  redirect("/labor");
}

export async function setWorkerActive(id: string, active: boolean) {
  const { supabase } = await getSession();
  await supabase.from("workers").update({ active }).eq("id", id);
  refresh();
}

// ─── Daily site log ──────────────────────────────────────────────────────────

/**
 * Saves one day on one project: attendance for each worker listed in the form
 * (days_<id> = "" | "0.5" | "1", ot_<id> = hours) plus the site diary.
 * Days already in a recorded payroll are left as they are.
 */
export async function saveSiteLog(projectId: string, date: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId } = await getSession();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("Choose a date.");

  const workerIds = fd.getAll("worker_id").map(String);
  const { data: existingRows } = await supabase
    .from("attendance")
    .select("id, worker_id, payroll_run_id")
    .eq("project_id", projectId)
    .eq("date", date);
  const existing = new Map((existingRows ?? []).map((r) => [r.worker_id as string, r]));

  const toDelete: string[] = [];
  const toUpsert: { id?: string; org_id: string; project_id: string; worker_id: string; date: string; days: number; ot_hours: number }[] = [];
  for (const w of workerIds) {
    const prev = existing.get(w);
    if (prev?.payroll_run_id) continue; // locked: already paid
    const days = str(fd, `days_${w}`) === "" ? 0 : num(str(fd, `days_${w}`));
    const ot = str(fd, `ot_${w}`) === "" ? 0 : num(str(fd, `ot_${w}`), 1);
    if (!(ot >= 0 && ot <= 16)) return fail("Overtime must be between 0 and 16 hours.");
    if (days === 0) {
      if (ot > 0) return fail("Overtime needs the worker to be marked present.");
      if (prev) toDelete.push(prev.id as string);
      continue;
    }
    if (!(days > 0 && days <= 1)) return fail("Days must be a half day or a full day.");
    toUpsert.push({ ...(prev ? { id: prev.id as string } : {}), org_id: orgId, project_id: projectId, worker_id: w, date, days, ot_hours: ot });
  }

  if (toDelete.length) {
    const { error } = await supabase.from("attendance").delete().in("id", toDelete);
    if (error) return fail("Couldn’t save attendance. " + dbMessage(error));
  }
  for (const row of toUpsert) {
    const { id, ...values } = row;
    const { error } = id
      ? await supabase.from("attendance").update({ days: values.days, ot_hours: values.ot_hours }).eq("id", id)
      : await supabase.from("attendance").insert(values);
    if (error) {
      if (error.code === "23505") {
        const { data: w } = await supabase.from("workers").select("name").eq("id", row.worker_id).maybeSingle();
        return fail(`${w?.name ?? "A worker"} is already logged on another project that day.`);
      }
      return fail("Couldn’t save attendance. " + dbMessage(error));
    }
  }

  const diary = { weather: optStr(fd, "weather"), work_done: optStr(fd, "work_done"), issues: optStr(fd, "issues") };
  if (diary.weather || diary.work_done || diary.issues) {
    const { error } = await supabase
      .from("daily_logs")
      .upsert({ org_id: orgId, project_id: projectId, date, ...diary, updated_at: new Date().toISOString() }, { onConflict: "project_id,date" });
    if (error) return fail("Couldn’t save the site diary. " + dbMessage(error));
  } else {
    await supabase.from("daily_logs").delete().eq("project_id", projectId).eq("date", date);
  }

  refresh();
  return ok();
}

// ─── Payroll ─────────────────────────────────────────────────────────────────

export async function recordPayroll(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await getSession();
  const projectId = str(fd, "project_id");
  const from = optDate(fd, "from");
  const to = optDate(fd, "to");
  if (!projectId || !from || !to) return fail("Choose a project and period.");
  const { data, error } = await supabase.rpc("record_payroll", {
    p_project: projectId,
    p_start: from,
    p_end: to,
    p_paid_on: optDate(fd, "paid_on"),
  });
  if (error) return fail(dbMessage(error));
  refresh();
  redirect(`/labor/payroll/${data}`);
}

export async function undoPayroll(id: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.rpc("undo_payroll", { p_run: id });
  if (error) return fail(dbMessage(error));
  refresh();
  redirect("/labor?view=payroll");
}

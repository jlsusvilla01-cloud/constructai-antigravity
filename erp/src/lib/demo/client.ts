import type { SupabaseClient } from "@supabase/supabase-js";
import snapshot from "./snapshot.json";

/**
 * Demo mode: a read-only stand-in for the Supabase client, serving the demo company
 * from snapshot.json (made by scripts/demo-snapshot.sh). It supports the query
 * operators this app uses. Every write returns DEMO_ERROR, so actions show
 * "changes aren't saved" instead of failing silently.
 *
 * Dates in the snapshot are moved forward so it always looks current: a billing
 * that was 10 days overdue on the snapshot day is 10 days overdue today.
 */

export const DEMO_MESSAGE = "This is a demo, so changes aren’t saved.";
const DEMO_ERROR = { message: DEMO_MESSAGE, code: "DEMO", details: "", hint: "" };

type Row = Record<string, unknown>;
type Result = { data: unknown; error: typeof DEMO_ERROR | null; count?: number | null };

// ─── Date shifting ───────────────────────────────────────────────────────────

const DAY = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}($|T)/;

/** Today's date in the Philippines (YYYY-MM-DD). */
const manilaToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());

function shiftValue(v: unknown, days: number): unknown {
  if (typeof v === "string" && DATE_RE.test(v)) {
    if (v.length === 10) return new Date(Date.parse(v + "T00:00:00Z") + days * DAY).toISOString().slice(0, 10);
    const t = Date.parse(v);
    return Number.isNaN(t) ? v : new Date(t + days * DAY).toISOString();
  }
  if (Array.isArray(v)) return v.map((x) => shiftValue(x, days));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shiftValue(x, days)]));
  return v;
}

let cache: { day: string; data: typeof snapshot } | null = null;

/** The snapshot with dates moved to today. Recomputed once per day. */
function data() {
  const today = manilaToday();
  if (cache?.day !== today) {
    const days = Math.round((Date.parse(today) - Date.parse(snapshot.snapshotDate)) / DAY);
    cache = { day: today, data: shiftValue(snapshot, days) as typeof snapshot };
  }
  return cache.data;
}

// ─── Query builder ───────────────────────────────────────────────────────────

/** Tables that can be embedded in a select, and the column that points to them. */
const EMBED_FK: Record<string, string> = { organizations: "org_id", projects: "project_id", suppliers: "supplier_id" };

const cmp = (a: unknown, b: unknown) => {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  const na = Number(a), nb = Number(b);
  if (typeof a !== "string" || typeof b !== "string" || DATE_RE.test(a)) return String(a).localeCompare(String(b));
  return Number.isFinite(na) && Number.isFinite(nb) ? na - nb : a.localeCompare(b);
};

const same = (a: unknown, b: unknown) => (a === null || a === undefined ? b === null : String(a) === String(b));

class DemoQuery implements PromiseLike<Result> {
  private filters: ((r: Row) => boolean)[] = [];
  private sorts: { col: string; asc: boolean }[] = [];
  private cols = "*";
  private max = Infinity;
  private from = 0;
  private mode: "many" | "single" | "maybe" = "many";
  private write = false;

  constructor(private table: string) {}

  select(cols = "*") {
    this.cols = cols;
    return this;
  }
  insert() { this.write = true; return this; }
  update() { this.write = true; return this; }
  upsert() { this.write = true; return this; }
  delete() { this.write = true; return this; }

  eq(c: string, v: unknown) { this.filters.push((r) => same(r[c], v)); return this; }
  neq(c: string, v: unknown) { this.filters.push((r) => !same(r[c], v)); return this; }
  is(c: string, v: unknown) { this.filters.push((r) => (v === null ? r[c] === null || r[c] === undefined : r[c] === v)); return this; }
  in(c: string, vs: unknown[]) { this.filters.push((r) => vs.some((v) => same(r[c], v))); return this; }
  gt(c: string, v: unknown) { this.filters.push((r) => r[c] != null && cmp(r[c], v) > 0); return this; }
  gte(c: string, v: unknown) { this.filters.push((r) => r[c] != null && cmp(r[c], v) >= 0); return this; }
  lt(c: string, v: unknown) { this.filters.push((r) => r[c] != null && cmp(r[c], v) < 0); return this; }
  lte(c: string, v: unknown) { this.filters.push((r) => r[c] != null && cmp(r[c], v) <= 0); return this; }
  ilike(c: string, pattern: string) {
    const re = new RegExp(
      "^" +
        pattern
          .replace(/\\([\\%_])|([.*+?^${}()|[\]\\])|(%)|(_)/g, (_, esc, special, pct, und) =>
            esc ? "\\" + esc : special ? "\\" + special : pct ? ".*" : und ? "." : "",
          ) +
        "$",
      "i",
    );
    this.filters.push((r) => re.test(String(r[c] ?? "")));
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) { this.sorts.push({ col, asc: opts?.ascending ?? true }); return this; }
  limit(n: number) { this.max = n; return this; }
  range(a: number, b: number) { this.from = a; this.max = b - a + 1; return this; }
  single() { this.mode = "single"; return this; }
  maybeSingle() { this.mode = "maybe"; return this; }

  private project(row: Row): Row {
    if (this.cols.trim() === "*") return { ...row };
    const out: Row = {};
    for (const part of this.cols.split(/,(?![^(]*\))/).map((s) => s.trim()).filter(Boolean)) {
      const embed = part.match(/^(\w+)\((.*)\)$/);
      if (embed) {
        const [, table, inner] = embed;
        const fk = EMBED_FK[table];
        const parent = (tables()[table] ?? []).find((p) => fk && same(p.id, row[fk]));
        out[table] = parent ? new DemoQuery(table).select(inner).project(parent) : null;
      } else if (part === "*") Object.assign(out, row);
      else out[part] = row[part];
    }
    return out;
  }

  private run(): Result {
    if (this.write) return { data: null, error: DEMO_ERROR };
    let rows = (tables()[this.table] ?? []).filter((r) => this.filters.every((f) => f(r)));
    if (this.sorts.length) {
      rows = [...rows].sort((a, b) => {
        for (const s of this.sorts) {
          const d = cmp(a[s.col], b[s.col]);
          if (d) return s.asc ? d : -d;
        }
        return 0;
      });
    }
    rows = rows.slice(this.from, this.from + this.max).map((r) => this.project(r));
    if (this.mode === "many") return { data: rows, error: null, count: rows.length };
    if (this.mode === "single" && rows.length !== 1) {
      return { data: null, error: { ...DEMO_ERROR, message: "Not found.", code: "PGRST116" } };
    }
    return { data: rows[0] ?? null, error: null };
  }

  then<A = Result, B = never>(ok?: ((v: Result) => A | PromiseLike<A>) | null, no?: ((e: unknown) => B | PromiseLike<B>) | null) {
    return Promise.resolve(this.run()).then(ok, no);
  }
}

const tables = () => data().tables as unknown as Record<string, Row[]>;

// ─── Client ──────────────────────────────────────────────────────────────────

export function demoUser() {
  return data().user;
}

export function createDemoClient(): SupabaseClient {
  const client = {
    from: (table: string) => new DemoQuery(table),
    rpc: async (fn: string) => {
      if (fn === "org_members") return { data: data().org_members, error: null };
      if (fn === "invitation_preview") return { data: [], error: null };
      return { data: null, error: DEMO_ERROR };
    },
    auth: {
      getUser: async () => ({ data: { user: demoUser() }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: DEMO_ERROR }),
      signUp: async () => ({ data: { user: null, session: null }, error: DEMO_ERROR }),
      signOut: async () => ({ error: null }),
    },
  };
  return client as unknown as SupabaseClient;
}

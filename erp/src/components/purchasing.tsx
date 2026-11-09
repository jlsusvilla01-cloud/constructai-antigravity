import Link from "next/link";
import { fmtDate, php } from "@/lib/format";
import type { PurchaseOrderSummary } from "@/lib/types";
import { PoStatusBadge } from "./badges";
import { EmptyState } from "./ui";

export function PoList({ pos, projectNames }: { pos: PurchaseOrderSummary[]; projectNames?: Map<string, string> }) {
  if (pos.length === 0) return <EmptyState title="No purchase orders here">Create a PO when you order materials or hire equipment.</EmptyState>;
  return (
    <ul className="divide-y divide-line">
      {pos.map((p) => (
        <li key={p.id}>
          <Link href={`/purchasing/${p.id}`} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-4 py-3 hover:bg-canvas/50 sm:grid-cols-[1fr_auto_auto] sm:px-5">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">
                <span className="mr-1.5 text-muted">{p.po_number}</span>
                {p.supplier_name}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted">
                {projectNames && <span className="text-ink">{projectNames.get(p.project_id)} · </span>}
                Ordered {fmtDate(p.order_date)}
                {p.paid_date ? ` · Paid ${fmtDate(p.paid_date)}` : p.expected_date && p.status === "ordered" ? ` · Expected ${fmtDate(p.expected_date)}` : ""}
                {p.notes ? ` · ${p.notes}` : ""}
              </p>
            </div>
            <div className="self-center sm:order-last">
              <PoStatusBadge status={p.status} paid={Boolean(p.expense_id)} />
            </div>
            <p className="text-sm font-semibold tabular-nums text-ink sm:self-center sm:text-right">{php(p.total)}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

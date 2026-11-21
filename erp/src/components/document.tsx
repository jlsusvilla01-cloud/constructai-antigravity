import type { ReactNode } from "react";
import type { Organization } from "@/lib/types";
import { Card } from "./ui";

/** Paper-style card for printable documents (billing statements, receipts, POs, payroll). */
export function DocumentCard({ children }: { children: ReactNode }) {
  return <Card className="p-5 sm:p-8 print:border-0 print:p-0 print:shadow-none">{children}</Card>;
}

/** Company letterhead on the left, document title and reference details on the right. */
export function Letterhead({
  org,
  title,
  meta,
}: {
  org: Pick<Organization, "name" | "address" | "tin" | "phone" | "email"> | null;
  title: string;
  meta: [string, ReactNode][];
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
      <div>
        <p className="text-lg font-semibold text-ink">{org?.name}</p>
        <div className="text-sm text-muted">
          {org?.address && <p>{org.address}</p>}
          {(org?.phone || org?.email) && <p>{[org.phone, org.email].filter(Boolean).join(" · ")}</p>}
          {org?.tin && <p>TIN {org.tin}</p>}
        </div>
      </div>
      <div className="text-right">
        <p className="text-base font-semibold uppercase tracking-wide text-ink">{title}</p>
        <dl className="mt-1 grid grid-cols-[auto_auto] justify-end gap-x-4 gap-y-0.5 text-sm">
          {meta.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd className="text-left font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/** Two signature blanks at the foot of a document. */
export function SignatureLines({ labels }: { labels: [string, string] }) {
  return (
    <div className="mt-12 grid gap-10 text-sm sm:grid-cols-2 print:grid-cols-2">
      {labels.map((l) => (
        <div key={l}>
          <div className="h-8 border-b border-ink/40" />
          <p className="mt-1 text-muted">{l}</p>
        </div>
      ))}
    </div>
  );
}

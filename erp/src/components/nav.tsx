"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
  { href: "/projects", label: "Projects", icon: "M3 21V9l9-6 9 6v12h-6v-7H9v7H3z" },
  { href: "/expenses", label: "Costs", icon: "M4 4h16v4H4V4zm0 6h16v10H4V10zm4 3v2h8v-2H8z" },
  { href: "/billings", label: "Billings", icon: "M6 2h9l5 5v15H6V2zm8 1.5V8h4.5M9 12h8M9 16h8" },
  { href: "/purchasing", label: "Purchasing", icon: "M3 4h2l2.4 11h11.2L21 7H6.2M9 20a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const isActive = (path: string, href: string) => path === href || path.startsWith(href + "/");

export function SideNav() {
  const path = usePathname();
  return (
    <nav className="space-y-0.5">
      {ITEMS.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={cx(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(path, it.href) ? "bg-brand-soft text-brand-strong" : "text-muted hover:bg-canvas hover:text-ink",
          )}
        >
          <Icon d={it.icon} />
          {it.label}
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line print:hidden bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {ITEMS.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={cx(
            "flex flex-col items-center gap-1 py-2 text-[11px] font-medium",
            isActive(path, it.href) ? "text-brand" : "text-muted",
          )}
        >
          <Icon d={it.icon} />
          {it.label}
        </Link>
      ))}
    </nav>
  );
}

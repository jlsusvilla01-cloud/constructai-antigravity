export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--color-brand)" />
        <path d="M8 22V13l8-5 8 5v9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M13 22v-5h6v5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
      </svg>
      {!compact && <span className="text-[15px] font-semibold tracking-tight text-ink">ConstructAI</span>}
    </span>
  );
}

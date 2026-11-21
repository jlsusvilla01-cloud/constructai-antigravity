"use client";

import { useState } from "react";

/** Copies text to the clipboard (e.g. an invitation link to paste into Viber or Messenger). */
export function CopyButton({ text, label = "Copy link" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          window.prompt("Copy this link:", text);
          return;
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink hover:bg-canvas"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

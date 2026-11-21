"use client";

import { Button } from "./ui";

export function PrintButton({ label = "Print / PDF" }: { label?: string }) {
  return (
    <Button type="button" variant="secondary" onClick={() => window.print()}>
      {label}
    </Button>
  );
}

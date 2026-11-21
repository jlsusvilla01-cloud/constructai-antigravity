const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const SCALES = ["", "Thousand", "Million", "Billion"];

function below1000(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ""));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
}

function integerWords(n: number): string {
  if (n === 0) return "Zero";
  const groups: string[] = [];
  for (let i = 0; n > 0; i++, n = Math.floor(n / 1000)) {
    const chunk = n % 1000;
    if (chunk) groups.unshift(below1000(chunk) + (SCALES[i] ? ` ${SCALES[i]}` : ""));
  }
  return groups.join(" ");
}

/** 1250.5 → "One Thousand Two Hundred Fifty Pesos and 50/100" (as written on Philippine checks and receipts). */
export function pesoWords(amount: number) {
  const cents = Math.round(Math.abs(amount) * 100);
  const pesos = Math.floor(cents / 100);
  const c = cents % 100;
  return `${integerWords(pesos)} ${pesos === 1 ? "Peso" : "Pesos"}${c ? ` and ${String(c).padStart(2, "0")}/100` : " Only"}`;
}

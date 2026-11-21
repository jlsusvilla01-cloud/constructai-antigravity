import { EXPENSE_CATEGORIES } from "./constants";
import { num } from "./format";
import type { ExpenseCategory } from "./types";

export type BoqValues = {
  item_no: string | null;
  description: string;
  category: ExpenseCategory;
  unit: string | null;
  quantity: number;
  unit_cost: number;
};

/**
 * Lines pasted from Excel / Google Sheets (tab-separated), one item per row:
 *   Item no. | Description | Unit | Quantity | Unit cost | Category (optional)
 * Header rows and rows without a numeric quantity and unit cost are skipped.
 */
export function parseBoqPaste(text: string) {
  const rows: BoqValues[] = [];
  let skipped = 0;
  const categoryOf = (v: string | undefined) => {
    const t = (v ?? "").trim().toLowerCase();
    return EXPENSE_CATEGORIES.find((c) => c.value === t || c.label.toLowerCase() === t)?.value ?? "materials";
  };
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = line.split("\t").map((c) => c.trim());
    const [itemNo, description, unit, qty, cost, category] = cells;
    const quantity = num(qty ?? "", 3);
    const unitCost = num(cost ?? "");
    if (!description || !(quantity >= 0) || !(unitCost >= 0)) {
      skipped++;
      continue;
    }
    rows.push({
      item_no: itemNo || null,
      description,
      unit: unit || null,
      quantity,
      unit_cost: unitCost,
      category: categoryOf(category),
    });
  }
  return { rows, skipped };
}


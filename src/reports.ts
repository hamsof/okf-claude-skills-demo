import type { Invoice } from './pos.ts';

export function salesByProduct(invoices: Invoice[]): { name: string; qty: number; revenue: number }[] {
  const rows = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const inv of invoices) {
    for (const line of inv.items) {
      const row = rows.get(line.product.sku) ?? { name: line.product.name, qty: 0, revenue: 0 };
      row.qty += line.qty;
      row.revenue += line.product.price * line.qty;
      rows.set(line.product.sku, row);
    }
  }
  return [...rows.values()].sort((a, b) => b.revenue - a.revenue);
}

export function salesByInvoice(invoices: Invoice[]): { number: string; items: number; total: number }[] {
  return invoices.map((inv) => ({
    number: inv.number,
    items: inv.items.reduce((sum, l) => sum + l.qty, 0),
    total: inv.total,
  }));
}

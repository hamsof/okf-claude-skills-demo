export interface Product {
  sku: string;
  name: string;
  price: number;
}

export interface Invoice {
  number: string;
  items: { product: Product; qty: number }[];
  total: number;
}

const CATALOG: Product[] = [
  { sku: 'COF', name: 'Coffee', price: 12 },
  { sku: 'TEA', name: 'Tea', price: 8 },
  { sku: 'CAKE', name: 'Cake', price: 20 },
];

export function findProduct(sku: string): Product {
  const p = CATALOG.find((x) => x.sku === sku);
  if (!p) throw new Error(`Unknown SKU: ${sku}`);
  return p;
}

export function checkout(items: { sku: string; qty: number }[], n: number): Invoice {
  const lines = items.map((i) => ({ product: findProduct(i.sku), qty: i.qty }));
  const total = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  return { number: `INV-${n}`, items: lines, total };
}

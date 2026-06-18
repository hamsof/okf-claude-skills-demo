import { checkout } from './pos.ts';
import { salesByProduct, salesByInvoice } from './reports.ts';

const invoices = [
  checkout([{ sku: 'COF', qty: 2 }, { sku: 'CAKE', qty: 1 }], 1001),
  checkout([{ sku: 'TEA', qty: 1 }, { sku: 'COF', qty: 1 }], 1002),
];

console.log('Sales by product:', salesByProduct(invoices));
console.log('Sales by invoice:', salesByInvoice(invoices));

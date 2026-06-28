import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function POST(request) {
  const db = getDb();
  const { product_id, customer_name, rating, comment } = await request.json();
  db.prepare('INSERT INTO reviews (product_id, customer_name, rating, comment) VALUES (?,?,?,?)').run(product_id, customer_name, rating, comment);
  const avg = db.prepare('SELECT AVG(rating) as a, COUNT(*) as c FROM reviews WHERE product_id = ?').get(product_id);
  db.prepare('UPDATE products SET rating=?, reviews_count=? WHERE id=?').run(parseFloat(avg.a).toFixed(1), avg.c, product_id);
  return NextResponse.json({ success: true });
}

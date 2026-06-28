import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request, { params }) {
  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(params.id);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const reviews = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC').all(params.id);
  return NextResponse.json({ ...product, reviews });
}

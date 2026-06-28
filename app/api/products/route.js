import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const featured = searchParams.get('featured');
  const limit = searchParams.get('limit');

  let q = 'SELECT * FROM products WHERE 1=1';
  const p = [];
  if (category && category !== 'All') { q += ' AND category = ?'; p.push(category); }
  if (search) {
    q += ' AND (name LIKE ? OR description LIKE ? OR category LIKE ?)';
    const s = `%${search}%`; p.push(s, s, s);
  }
  if (featured === 'true') { q += ' AND featured = 1'; }
  q += ' ORDER BY featured DESC, rating DESC';
  if (limit) q += ` LIMIT ${parseInt(limit)}`;

  const products = db.prepare(q).all(...p);
  return NextResponse.json(products);
}

import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'gowri_pickles_secret_2024_jwt_key';

function verifyAuth(request) {
  const auth = request.headers.get('authorization');
  if (!auth) return null;
  try {
    const jwt = require('jsonwebtoken');
    return jwt.verify(auth.split(' ')[1], JWT_SECRET);
  } catch { return null; }
}

export async function GET(request) {
  if (!verifyAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  let q = 'SELECT * FROM orders';
  const p = [];
  if (status && status !== 'All') { q += ' WHERE status = ?'; p.push(status); }
  q += ' ORDER BY created_at DESC';
  return NextResponse.json(db.prepare(q).all(...p));
}

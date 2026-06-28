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

export async function PUT(request, { params }) {
  if (!verifyAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  const { status } = await request.json();
  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(params.id);
  return NextResponse.json({ success: true, order });
}

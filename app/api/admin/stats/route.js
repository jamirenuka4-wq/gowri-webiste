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
  return NextResponse.json({
    totalOrders:   db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
    pendingOrders: db.prepare("SELECT COUNT(*) as c FROM orders WHERE status='Pending'").get().c,
    totalRevenue:  db.prepare('SELECT COALESCE(SUM(total),0) as s FROM orders').get().s,
    totalProducts: db.prepare('SELECT COUNT(*) as c FROM products').get().c,
    recentOrders:  db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5').all(),
  });
}

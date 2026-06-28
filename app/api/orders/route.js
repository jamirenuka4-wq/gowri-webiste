import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function POST(request) {
  const db = getDb();
  const body = await request.json();
  const { customer_name, customer_email, customer_phone, address, city, state, pincode, items, subtotal, shipping, total, payment_method, notes } = body;
  const order_number = 'GP' + Date.now().toString().slice(-8);
  const result = db.prepare(
    'INSERT INTO orders (order_number,customer_name,customer_email,customer_phone,address,city,state,pincode,items,subtotal,shipping,total,payment_method,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
  ).run(order_number, customer_name, customer_email, customer_phone, address, city, state, pincode, JSON.stringify(items), subtotal, shipping || 0, total, payment_method || 'COD', notes || '');
  return NextResponse.json({ success: true, order_number, order_id: result.lastInsertRowid });
}

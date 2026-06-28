import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const db = getDb();
  const products = db.prepare('SELECT id FROM products').all();
  let xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.gowripickles.com/</loc><priority>1.0</priority><changefreq>daily</changefreq></url>
  <url><loc>https://www.gowripickles.com/cart</loc><priority>0.6</priority></url>`;
  for (const p of products) {
    xml += `\n  <url><loc>https://www.gowripickles.com/product/${p.id}</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>`;
  }
  xml += '\n</urlset>';
  return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } });
}

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const db = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const JWT_SECRET = 'gowri_pickles_secret_2024_jwt_key';
const PORT = process.env.PORT || 3000;

// Helper: send an HTML file by name from public/
function sendPage(res, ...relPath) {
  const abs = path.resolve(__dirname, 'public', ...relPath);
  res.sendFile(abs, { dotfiles: 'allow' }, (err) => {
    if (err) {
      console.error('sendFile error:', abs, err.message);
      res.status(500).send('<h1>Server Error</h1><p>Could not load page. <a href="/">Home</a></p>');
    }
  });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ===================== MIDDLEWARE =====================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Redirect any .html URL to clean URL (must come before static)
app.use((req, res, next) => {
  const m = req.path.match(/^(\/.*?)\.html(\/.*)?$/i);
  if (m) {
    const base = m[1];  // e.g. '/product'
    const rest = m[2] || ''; // e.g. '/1'
    let clean = base === '/index' ? '/' : (base + rest);
    return res.redirect(301, clean || '/');
  }
  next();
});

// 2. Serve static assets (public folder) — NO index.html auto-serving
app.use(express.static(path.resolve(__dirname, 'public'), { index: false, dotfiles: 'allow' }));

// 3. Serve uploads
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads'), { dotfiles: 'allow' }));


// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ===================== API ROUTES =====================

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, username: admin.username });
});

// Products (public)
app.get('/api/products', (req, res) => {
  const { category, search, featured, limit } = req.query;
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
  res.json(db.prepare(q).all(...p));
});

app.get('/api/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const reviews = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json({ ...product, reviews });
});

// Products (admin CRUD)
app.post('/api/admin/products', authenticate, upload.single('image'), (req, res) => {
  const { name, description, price, original_price, category, weight, spice_level, ingredients, shelf_life, featured, in_stock, image_url } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : (image_url || '/images/mango_pickle.png');
  const result = db.prepare(
    'INSERT INTO products (name, description, price, original_price, category, image, weight, spice_level, ingredients, shelf_life, featured, in_stock) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
  ).run(name, description, parseFloat(price), parseFloat(original_price) || null, category, image, weight, spice_level, ingredients, shelf_life, featured ? 1 : 0, in_stock !== '0' ? 1 : 0);
  res.json({ success: true, product: db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid) });
});

app.put('/api/admin/products/:id', authenticate, upload.single('image'), (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { name, description, price, original_price, category, weight, spice_level, ingredients, shelf_life, featured, in_stock, image_url } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : (image_url || existing.image);
  db.prepare('UPDATE products SET name=?,description=?,price=?,original_price=?,category=?,image=?,weight=?,spice_level=?,ingredients=?,shelf_life=?,featured=?,in_stock=? WHERE id=?')
    .run(name, description, parseFloat(price), parseFloat(original_price) || null, category, image, weight, spice_level, ingredients, shelf_life, featured ? 1 : 0, in_stock !== '0' ? 1 : 0, req.params.id);
  res.json({ success: true, product: db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) });
});

app.delete('/api/admin/products/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Orders (public)
app.post('/api/orders', (req, res) => {
  const { customer_name, customer_email, customer_phone, address, city, state, pincode, items, subtotal, shipping, total, payment_method, notes } = req.body;
  const order_number = 'GP' + Date.now().toString().slice(-8);
  const result = db.prepare(
    'INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, address, city, state, pincode, items, subtotal, shipping, total, payment_method, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
  ).run(order_number, customer_name, customer_email, customer_phone, address, city, state, pincode, JSON.stringify(items), subtotal, shipping || 0, total, payment_method || 'COD', notes || '');

  const newOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
  io.to('admin-room').emit('new-order', {
    id: newOrder.id,
    order_number: newOrder.order_number,
    customer_name: newOrder.customer_name,
    total: newOrder.total,
    items_count: JSON.parse(newOrder.items).length
  });
  res.json({ success: true, order_number, order_id: result.lastInsertRowid });
});

// Orders (admin)
app.get('/api/admin/orders', authenticate, (req, res) => {
  const { status, limit } = req.query;
  let q = 'SELECT * FROM orders';
  const p = [];
  if (status && status !== 'All') { q += ' WHERE status = ?'; p.push(status); }
  q += ' ORDER BY created_at DESC';
  if (limit) q += ` LIMIT ${parseInt(limit)}`;
  res.json(db.prepare(q).all(...p));
});

app.put('/api/admin/orders/:id/status', authenticate, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  io.to('admin-room').emit('order-updated', { id: order.id, order_number: order.order_number, status });
  res.json({ success: true, order });
});

// Stats (admin)
app.get('/api/admin/stats', authenticate, (req, res) => {
  res.json({
    totalOrders: db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
    pendingOrders: db.prepare("SELECT COUNT(*) as c FROM orders WHERE status='Pending'").get().c,
    totalRevenue: db.prepare('SELECT SUM(total) as s FROM orders').get().s || 0,
    totalProducts: db.prepare('SELECT COUNT(*) as c FROM products').get().c,
    recentOrders: db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5').all()
  });
});

// Reviews
app.post('/api/reviews', (req, res) => {
  const { product_id, customer_name, rating, comment } = req.body;
  db.prepare('INSERT INTO reviews (product_id, customer_name, rating, comment) VALUES (?,?,?,?)').run(product_id, customer_name, rating, comment);
  const avg = db.prepare('SELECT AVG(rating) as a, COUNT(*) as c FROM reviews WHERE product_id = ?').get(product_id);
  db.prepare('UPDATE products SET rating=?, reviews_count=? WHERE id=?').run(parseFloat(avg.a).toFixed(1), avg.c, product_id);
  res.json({ success: true });
});

// Socket.IO
io.on('connection', (socket) => {
  socket.on('join-admin', () => socket.join('admin-room'));
});

// Sitemap
app.get('/sitemap.xml', (req, res) => {
  const products = db.prepare('SELECT id FROM products').all();
  let xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.gowripickles.com/</loc><priority>1.0</priority><changefreq>daily</changefreq></url>`;
  products.forEach(p => {
    xml += `\n  <url><loc>https://www.gowripickles.com/product/${p.id}</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>`;
  });
  xml += '\n</urlset>';
  res.set('Content-Type', 'text/xml').send(xml);
});

// ===================== PAGE ROUTES =====================
// These serve HTML files. express.static (above) won't serve .html files
// because index:false and .html redirect catches them first.

app.get('/',                 (req, res) => sendPage(res, 'index.html'));
app.get('/product/:id',      (req, res) => sendPage(res, 'product.html'));
app.get('/cart',             (req, res) => sendPage(res, 'cart.html'));
app.get('/checkout',         (req, res) => sendPage(res, 'checkout.html'));
app.get('/order-success',    (req, res) => sendPage(res, 'order-success.html'));
app.get('/admin',            (req, res) => sendPage(res, 'admin', 'login.html'));
app.get('/admin/dashboard',  (req, res) => sendPage(res, 'admin', 'dashboard.html'));
app.get('/index',            (req, res) => res.redirect(301, '/'));

// 404 catch-all
app.use((req, res) => {
  const abs404 = path.resolve(__dirname, 'public', '404.html');
  if (fs.existsSync(abs404)) {
    res.status(404).sendFile(abs404, { dotfiles: 'allow' });
  } else {
    res.status(404).send('<h1>404 – Page Not Found</h1><a href="/">← Back to Gowri Pickles</a>');
  }
});

// ===================== START =====================
server.listen(PORT, () => {
  console.log(`\n🌶️  Gowri Pickles is LIVE at http://localhost:${PORT}`);
  console.log(`📦  Admin Panel  → http://localhost:${PORT}/admin`);
  console.log(`🔑  Login        → admin / admin123`);
  console.log(`🛒  Store        → http://localhost:${PORT}/\n`);
});

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'gowri_pickles.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    original_price REAL,
    category TEXT NOT NULL,
    image TEXT,
    weight TEXT,
    spice_level TEXT DEFAULT 'Medium',
    ingredients TEXT,
    shelf_life TEXT DEFAULT '12 months',
    in_stock INTEGER DEFAULT 1,
    featured INTEGER DEFAULT 0,
    rating REAL DEFAULT 4.5,
    reviews_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    items TEXT NOT NULL,
    subtotal REAL NOT NULL,
    shipping REAL DEFAULT 0,
    total REAL NOT NULL,
    payment_method TEXT DEFAULT 'COD',
    status TEXT DEFAULT 'Pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

// Seed initial products
const existingProducts = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (existingProducts.count === 0) {
  const insertProduct = db.prepare(`
    INSERT INTO products (name, description, price, original_price, category, image, weight, spice_level, ingredients, shelf_life, featured, rating, reviews_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    ['Andhra Mango Pickle', 'Traditional Andhra-style raw mango pickle with authentic spices and sesame oil. A burst of tangy, spicy flavors in every bite.', 149, 199, 'Mango', '/images/mango_pickle.png', '250g', 'Hot', 'Raw Mango, Red Chilli, Sesame Oil, Mustard Seeds, Salt, Turmeric, Fenugreek', '12 months', 1, 4.8, 128],
    ['Sweet Lemon Pickle', 'Sun-dried sweet and tangy lemon pickle made with jaggery, spices and fresh lemons. Perfect accompaniment for every Indian meal.', 129, 169, 'Lemon', '/images/lemon_pickle.png', '250g', 'Mild', 'Lemon, Jaggery, Salt, Turmeric, Red Chilli, Asafoetida', '18 months', 1, 4.7, 95],
    ['Green Chilli Pickle', 'Fiery green chilli pickle made with farm-fresh chillies, aromatic spices. For those who love the heat!', 119, 149, 'Chilli', '/images/chilli_pickle.png', '200g', 'Extra Hot', 'Green Chilli, Mustard Oil, Mustard Seeds, Fennel, Salt, Turmeric', '9 months', 0, 4.6, 72],
    ['Mixed Vegetable Pickle', 'A delightful medley of seasonal vegetables — carrot, cauliflower, raw mango, green chilli — pickled in spiced mustard oil.', 159, 199, 'Mixed', '/images/mixed_pickle.png', '400g', 'Medium', 'Carrot, Cauliflower, Raw Mango, Green Chilli, Mustard Oil, Spices, Salt', '12 months', 1, 4.9, 156],
    ['Garlic Pickle', 'Pungent and flavorful garlic pickle slow-cooked with traditional South Indian spices. Boosts immunity and enhances any meal.', 139, 179, 'Special', '/images/garlic_pickle.png', '200g', 'Medium', 'Garlic, Sesame Oil, Red Chilli, Mustard Seeds, Salt, Tamarind, Turmeric', '15 months', 0, 4.7, 84],
    ['Tomato Pickle', 'Tangy sun-ripened tomato pickle with a perfect blend of South Indian spices. A versatile condiment for rice, roti and dosa.', 109, 139, 'Special', '/images/mango_pickle.png', '250g', 'Medium', 'Tomato, Red Chilli, Sesame Oil, Mustard Seeds, Curry Leaves, Salt, Turmeric', '6 months', 0, 4.5, 63],
    ['Raw Mango Thokku', 'Finely grated raw mango cooked with aromatic spices and sesame oil. A classic South Indian instant pickle loved by all.', 169, 219, 'Mango', '/images/mango_pickle.png', '300g', 'Hot', 'Raw Mango (grated), Sesame Oil, Red Chilli, Mustard Seeds, Salt, Turmeric, Asafoetida', '12 months', 1, 4.9, 201],
    ['Lemon Ginger Pickle', 'Zesty combination of fresh lemon and ginger pickled with rock salt and spices. Aids digestion and adds zing to any dish.', 139, 179, 'Lemon', '/images/lemon_pickle.png', '250g', 'Mild', 'Lemon, Ginger, Rock Salt, Red Chilli, Turmeric, Mustard Seeds', '18 months', 0, 4.6, 47],
  ];

  const insertMany = db.transaction((items) => {
    for (const item of items) insertProduct.run(...item);
  });
  insertMany(products);
}

// Seed admin user (password: admin123)
const existingAdmin = db.prepare('SELECT COUNT(*) as count FROM admins').get();
if (existingAdmin.count === 0) {
  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', hashedPassword);
}

// Seed sample reviews
const existingReviews = db.prepare('SELECT COUNT(*) as count FROM reviews').get();
if (existingReviews.count === 0) {
  const insertReview = db.prepare('INSERT INTO reviews (product_id, customer_name, rating, comment) VALUES (?, ?, ?, ?)');
  const reviews = [
    [1, 'Priya Sharma', 5, 'Absolutely authentic taste! Reminds me of my grandmother\'s pickle. Will order again!'],
    [1, 'Rajesh Kumar', 5, 'Best mango pickle I\'ve ever had. The spice level is perfect.'],
    [2, 'Anjali Reddy', 4, 'Love the sweet-tangy balance. My whole family enjoyed it.'],
    [4, 'Suresh Babu', 5, 'The mixed pickle is amazing! Fresh vegetables and perfect spices.'],
    [7, 'Lakshmi Devi', 5, 'Thokku is outstanding! Just like homemade. Great packaging too.'],
  ];
  const insertMany = db.transaction((items) => {
    for (const item of items) insertReview.run(...item);
  });
  insertMany(reviews);
}

module.exports = db;

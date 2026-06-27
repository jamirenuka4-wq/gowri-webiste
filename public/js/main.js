/* ============================================================
   GOWRI PICKLES – Main JS (Homepage + Shared Utils)
   ============================================================ */

// ===== Cart Utilities =====
const Cart = {
  get: () => {
    try { return JSON.parse(localStorage.getItem('gowri_cart') || '[]'); }
    catch { return []; }
  },
  save: (items) => localStorage.setItem('gowri_cart', JSON.stringify(items)),
  count: () => Cart.get().reduce((s, i) => s + (parseInt(i.qty) || 1), 0),
  total: () => Cart.get().reduce((s, i) => s + (parseFloat(i.price) * (parseInt(i.qty) || 1)), 0),
  add(product, qty = 1) {
    const items = Cart.get();
    const idx = items.findIndex(i => i.id === product.id);
    if (idx > -1) { items[idx].qty = (parseInt(items[idx].qty) || 1) + qty; }
    else { items.push({ ...product, qty }); }
    Cart.save(items);
    updateCartBadge();
    showToast('✅', 'Added to Cart!', product.name + ' added successfully.', 'success');
  }
};

// ===== Toast Notifications =====
function showToast(icon, title, desc, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type !== 'success' ? type : ''}`;
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <div class="toast-text">
      <div class="toast-title">${title}</div>
      ${desc ? `<div class="toast-desc">${desc}</div>` : ''}
    </div>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1rem;padding:0 0 0 8px;flex-shrink:0;">✕</button>
  `;
  container.appendChild(toast);
  setTimeout(() => toast && toast.parentElement && toast.remove(), 4000);
}

// ===== Cart Badge =====
function updateCartBadge() {
  const count = Cart.count();
  ['cartBadge', 'cartBadgeMobile'].forEach(id => {
    const badge = document.getElementById(id);
    if (!badge) return;
    if (count > 0) {
      badge.style.display = 'flex';
      badge.textContent = count;
    } else {
      badge.style.display = 'none';
    }
  });
  // Update mobile cart count text
  const mcc = document.getElementById('mobileCartCount');
  if (mcc) mcc.textContent = count;
}

// ===== Navbar =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ===== Hamburger =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', hamburger.classList.contains('active'));
  });
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('open');
    }
  });
}

// ===== Keyboard nav for categories =====
document.querySelectorAll('.category-card').forEach(card => {
  card.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' || e.key === ' ') card.click();
  });
});

// ===== Spice Particles =====
function createSpiceParticles() {
  const container = document.getElementById('heroSpices');
  if (!container) return;
  for (let i = 0; i < 10; i++) {
    const p = document.createElement('div');
    p.className = 'spice-particle';
    container.appendChild(p);
  }
}
createSpiceParticles();

// ===== Scroll Reveal =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => revealObserver.observe(el));

// ===== Products State =====
let allProducts = [];
let currentCategory = 'All';
let searchTerm = '';
let displayLimit = 8;

// ===== Load Products =====
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('API error');
    allProducts = await res.json();
    filterAndRender();
    loadCategoryCounts();
    loadReviews();
  } catch (err) {
    const grid = document.getElementById('productsGrid');
    if (grid) grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">⚠️</div><h3>Unable to load products</h3><p>Please refresh the page or check your connection.</p><button class="btn btn-primary" onclick="loadProducts()">Retry</button></div>`;
    console.error('Products load error:', err);
  }
}

// ===== Render Products =====
function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><h3>No pickles found</h3><p>Try a different search or category.</p><button class="btn btn-secondary" onclick="filterCategory('All')">Show All</button></div>`;
    document.getElementById('loadMoreBtn') && (document.getElementById('loadMoreBtn').style.display = 'none');
    return;
  }

  const sliced = products.slice(0, displayLimit);
  grid.innerHTML = sliced.map((p, i) => createProductCard(p, i)).join('');

  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.style.display = products.length > displayLimit ? 'inline-flex' : 'none';
  }

  // Re-observe for scroll animations
  grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

// ===== Create Product Card =====
function createProductCard(p, i = 0) {
  const discount = p.original_price && p.original_price > p.price
    ? Math.round((1 - p.price / p.original_price) * 100)
    : 0;
  const starsFull = Math.round(p.rating || 4.5);
  const starsHtml = '★'.repeat(starsFull) + '☆'.repeat(5 - starsFull);

  let badgeHtml = '';
  if (p.featured) badgeHtml = '<span class="card-badge badge-bestseller">⭐ Bestseller</span>';
  else if (discount >= 20) badgeHtml = '<span class="card-badge badge-sale">🏷️ ' + discount + '% OFF</span>';

  return `
    <article class="product-card ${p.featured ? 'featured' : ''} reveal"
             style="animation-delay:${i * 0.06}s"
             itemscope itemtype="https://schema.org/Product">
      <div class="product-card-image">
        <a href="/product/${p.id}" aria-label="View ${p.name}">
          <img src="${p.image}" alt="${p.name} – Authentic Indian Pickle by Gowri Pickles"
               loading="lazy" itemprop="image"
               onerror="this.src='/images/mango_pickle.png'">
        </a>
        ${badgeHtml}
        <button class="card-wishlist" onclick="toggleWishlist(${p.id}, this)" aria-label="Add to wishlist" title="Wishlist">🤍</button>
        <div class="card-overlay">
          <a href="/product/${p.id}" class="btn btn-sm" style="background:white;color:var(--text-dark);flex:1;justify-content:center;">👁️ Quick View</a>
          <button class="btn btn-sm btn-primary" onclick="addToCartQuick(${p.id})" style="flex:1;justify-content:center;" id="quickAtc-${p.id}">🛒 Add</button>
        </div>
      </div>
      <div class="product-card-body">
        <div class="product-category" itemprop="category">${p.category} Pickle</div>
        <h3 itemprop="name">
          <a href="/product/${p.id}" style="color:inherit;text-decoration:none;">${p.name}</a>
        </h3>
        <div class="product-rating" itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
          <span class="stars" aria-label="${p.rating} out of 5 stars">${starsHtml}</span>
          <meta itemprop="ratingValue" content="${p.rating}">
          <meta itemprop="reviewCount" content="${p.reviews_count || 0}">
          <span class="rating-count">${p.rating} (${p.reviews_count || 0})</span>
        </div>
        <div class="product-meta">
          <span class="meta-item">⚖️ ${p.weight || '250g'}</span>
          <span class="meta-item">🌶️ ${p.spice_level || 'Medium'}</span>
        </div>
        <div class="product-price-row">
          <div class="price-info">
            <span class="price" itemprop="price" content="${p.price}">₹${p.price}</span>
            ${p.original_price && p.original_price > p.price
              ? `<span class="price-original">₹${p.original_price}</span>
                 <span class="discount-badge">${discount}% OFF</span>`
              : ''}
          </div>
          <button class="add-to-cart-btn" id="atc-${p.id}"
                  onclick="addToCartDirect(${p.id})"
                  aria-label="Add ${p.name} to cart"
                  title="Add to Cart">+</button>
        </div>
      </div>
    </article>
  `;
}

// ===== Add to Cart =====
function addToCartDirect(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  Cart.add(product, 1);
  const btn = document.getElementById(`atc-${productId}`);
  if (btn) {
    btn.classList.add('added');
    btn.textContent = '✓';
    btn.style.background = 'var(--green)';
    setTimeout(() => {
      btn.classList.remove('added');
      btn.textContent = '+';
      btn.style.background = '';
    }, 1500);
  }
}

function addToCartQuick(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  Cart.add(product, 1);
}

function toggleWishlist(id, btn) {
  const isAdded = btn.textContent === '❤️';
  btn.textContent = isAdded ? '🤍' : '❤️';
  showToast(isAdded ? '🤍' : '❤️', isAdded ? 'Removed from Wishlist' : 'Added to Wishlist!', '', 'warning');
}

// ===== Load More =====
function loadMoreProducts() {
  displayLimit += 8;
  filterAndRender();
}

// ===== Category Filter =====
function filterCategory(category) {
  currentCategory = category;
  displayLimit = 8;

  document.querySelectorAll('.filter-tab').forEach(t => {
    const active = t.dataset.category === category;
    t.classList.toggle('active', active);
    t.setAttribute('aria-selected', active);
  });

  filterAndRender();

  // Smooth scroll to products
  const el = document.getElementById('products');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.getElementById('filterTabs')?.addEventListener('click', e => {
  const tab = e.target.closest('.filter-tab');
  if (tab) filterCategory(tab.dataset.category);
});

function filterAndRender() {
  let filtered = [...allProducts];
  if (currentCategory !== 'All') {
    filtered = filtered.filter(p => p.category === currentCategory);
  }
  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.ingredients || '').toLowerCase().includes(q)
    );
  }
  renderProducts(filtered);
}

// ===== Search =====
const searchInput = document.getElementById('searchInput');
const searchSuggestions = document.getElementById('searchSuggestions');
let searchTimeout = null;

searchInput?.addEventListener('input', () => {
  searchTerm = searchInput.value.trim();
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    filterAndRender();
    if (searchTerm.length >= 2) showSearchSuggestions();
    else searchSuggestions?.classList.remove('visible');
  }, 200);
});

searchInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    searchTerm = '';
    searchInput.value = '';
    filterAndRender();
    searchSuggestions?.classList.remove('visible');
  }
});

function showSearchSuggestions() {
  if (!searchSuggestions) return;
  const q = searchTerm.toLowerCase();
  const matches = allProducts.filter(p => p.name.toLowerCase().includes(q)).slice(0, 6);
  if (matches.length === 0) { searchSuggestions.classList.remove('visible'); return; }
  searchSuggestions.innerHTML = matches.map(p => `
    <div class="suggestion-item" onclick="window.location.href='/product/${p.id}'" role="option" tabindex="0">
      <img src="${p.image}" alt="${p.name}" onerror="this.src='/images/mango_pickle.png'">
      <div>
        <div style="font-weight:600;font-size:0.9rem;color:var(--text-dark)">${p.name}</div>
        <div style="font-size:0.78rem;color:var(--text-muted)">₹${p.price} • ${p.category}</div>
      </div>
      <div style="margin-left:auto;font-weight:700;color:var(--red);font-size:0.9rem;">₹${p.price}</div>
    </div>
  `).join('');
  searchSuggestions.classList.add('visible');
}

document.addEventListener('click', e => {
  if (!searchInput?.contains(e.target) && !searchSuggestions?.contains(e.target)) {
    searchSuggestions?.classList.remove('visible');
  }
});

// ===== Category Counts =====
function loadCategoryCounts() {
  const cats = ['Mango', 'Lemon', 'Chilli', 'Mixed', 'Special'];
  cats.forEach(cat => {
    const count = allProducts.filter(p => p.category === cat).length;
    const el = document.getElementById(`count${cat}`);
    if (el) el.textContent = count + (count === 1 ? ' Variety' : ' Varieties');
  });
}

// ===== Reviews =====
function loadReviews() {
  const grid = document.getElementById('reviewsGrid');
  if (!grid) return;
  const staticReviews = [
    { name: 'Priya Sharma',   rating: 5, comment: 'Absolutely authentic taste! Reminds me of my grandmother\'s pickle. Will definitely order again and again!', product: 'Andhra Mango Pickle', date: '3 days ago', city: 'Hyderabad' },
    { name: 'Rajesh Kumar',   rating: 5, comment: 'Best mango pickle I\'ve ever tasted. Perfect spice level and excellent oil quality. Delivery was super fast!', product: 'Andhra Mango Pickle', date: '1 week ago', city: 'Bangalore' },
    { name: 'Anjali Reddy',   rating: 4, comment: 'Love the sweet-tangy balance of the lemon pickle. My whole family enjoyed it with every meal!', product: 'Sweet Lemon Pickle', date: '2 weeks ago', city: 'Chennai' },
    { name: 'Suresh Babu',    rating: 5, comment: 'The mixed pickle is amazing! Fresh vegetables and perfect spices. Packaging was excellent — no leaks at all!', product: 'Mixed Vegetable Pickle', date: '1 month ago', city: 'Vijayawada' },
    { name: 'Lakshmi Devi',   rating: 5, comment: 'Thokku is outstanding! Just like homemade. I order every month without fail. Great product, great service!', product: 'Raw Mango Thokku', date: '1 month ago', city: 'Tirupati' },
    { name: 'Venkat Rao',     rating: 5, comment: 'Exceptional quality! You can taste the authenticity in every bite. 100% recommend to everyone who loves real pickles!', product: 'Garlic Pickle', date: '2 months ago', city: 'Guntur' },
  ];
  grid.innerHTML = staticReviews.map(r => {
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    const initials = r.name.split(' ').map(n => n[0]).join('');
    return `
      <article class="review-card reveal" itemscope itemtype="https://schema.org/Review">
        <div class="review-header">
          <div class="review-avatar" aria-hidden="true" style="background:var(--grad-hero)">${initials}</div>
          <div style="flex:1">
            <div class="reviewer-name" itemprop="author">${r.name}</div>
            <div class="review-date">📍 ${r.city} · ${r.date}</div>
          </div>
          <div class="stars" aria-label="${r.rating} out of 5 stars">${stars}</div>
        </div>
        <p class="review-text" itemprop="reviewBody">"${r.comment}"</p>
        <div class="review-product">📦 Ordered: <strong>${r.product}</strong></div>
        <div style="margin-top:10px;display:flex;align-items:center;gap:6px;font-size:0.8rem;color:var(--text-muted);">
          <span style="color:var(--green);font-weight:600;">✓ Verified Purchase</span>
        </div>
      </article>
    `;
  }).join('');
  grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

// ===== Newsletter =====
function subscribeNewsletter(e) {
  e.preventDefault();
  const email = document.getElementById('newsletterEmail')?.value;
  const btn = document.getElementById('subscribeBtn');
  if (!email) return;
  btn.textContent = '✅ Subscribed!';
  btn.style.background = 'var(--green)';
  btn.style.color = 'white';
  btn.disabled = true;
  showToast('🎉', 'Welcome to Gowri Pickles!', 'Your 15% discount code: WELCOME15', 'success');
  setTimeout(() => {
    btn.textContent = '🎁 Subscribe Free!';
    btn.style.background = '';
    btn.style.color = '';
    btn.disabled = false;
    document.getElementById('newsletterForm').reset();
  }, 4000);
}

// ===== Init =====
updateCartBadge();
loadProducts();

// Handle URL search param
const urlParams = new URLSearchParams(window.location.search);
const searchParam = urlParams.get('search');
if (searchParam && searchInput) {
  searchInput.value = searchParam;
  searchTerm = searchParam;
}

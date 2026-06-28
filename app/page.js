'use client';
import { useEffect, useState, useRef } from 'react';

// ─── Cart Utilities ────────────────────────────────────────────────
const Cart = {
  get: () => { try { return JSON.parse(localStorage.getItem('gowri_cart') || '[]'); } catch { return []; } },
  save: (items) => localStorage.setItem('gowri_cart', JSON.stringify(items)),
  count: () => Cart.get().reduce((s, i) => s + (parseInt(i.qty) || 1), 0),
  add(product, qty = 1) {
    const items = Cart.get();
    const idx = items.findIndex(i => i.id === product.id);
    if (idx > -1) items[idx].qty = (parseInt(items[idx].qty) || 1) + qty;
    else items.push({ ...product, qty });
    Cart.save(items);
  }
};

function showToast(icon, title, desc, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast ${type !== 'success' ? type : ''}`;
  t.innerHTML = `<span class="toast-icon">${icon}</span><div class="toast-text"><div class="toast-title">${title}</div>${desc ? `<div class="toast-desc">${desc}</div>` : ''}</div><button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;padding:0 0 0 8px;font-size:1rem;color:var(--text-muted);">✕</button>`;
  container.appendChild(t);
  setTimeout(() => t && t.parentElement && t.remove(), 4000);
}

function ProductCard({ p, onCartUpdate }) {
  const discount = p.original_price && p.original_price > p.price ? Math.round((1 - p.price / p.original_price) * 100) : 0;
  const stars = '★'.repeat(Math.round(p.rating || 4.5)) + '☆'.repeat(5 - Math.round(p.rating || 4.5));
  const [added, setAdded] = useState(false);

  const addToCart = () => {
    Cart.add(p, 1);
    onCartUpdate();
    setAdded(true);
    showToast('&#10003;', 'Added to Cart!', `${p.name} added successfully.`);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article className={`product-card ${p.featured ? 'featured' : ''} reveal`} itemScope itemType="https://schema.org/Product">
      <div className="product-card-image">
        <a href={`/product/${p.id}`} aria-label={`View ${p.name}`}>
          <img src={p.image} alt={`${p.name} – Authentic Indian Pickle by Gowri Pickles`}
               loading="lazy" itemProp="image" onError={(e) => e.target.src = '/images/mango_pickle.png'} />
        </a>
        {p.featured && <span className="card-badge badge-bestseller">⭐ Bestseller</span>}
        {!p.featured && discount >= 20 && <span className="card-badge badge-sale">🏷️ {discount}% OFF</span>}
        <div className="card-overlay">
          <a href={`/product/${p.id}`} className="btn btn-sm" style={{background:'white',color:'var(--text-dark)',flex:1,justifyContent:'center'}}>Quick View</a>
          <button className="btn btn-sm btn-primary" onClick={addToCart} style={{flex:1,justifyContent:'center'}}>Add to Cart</button>
        </div>
      </div>
      <div className="product-card-body">
        <div className="product-category" itemProp="category">{p.category} Pickle</div>
        <h3 itemProp="name"><a href={`/product/${p.id}`} style={{color:'inherit',textDecoration:'none'}}>{p.name}</a></h3>
        <div className="product-rating">
          <span className="stars" aria-label={`${p.rating} out of 5 stars`}>{stars}</span>
          <span className="rating-count">{p.rating} ({p.reviews_count || 0})</span>
        </div>
        <div className="product-meta">
          <span className="meta-item">{p.weight || '250g'}</span>
          <span className="meta-item">{p.spice_level || 'Medium'}</span>
        </div>
        <div className="product-price-row">
          <div className="price-info">
            <span className="price" itemProp="price">₹{p.price}</span>
            {p.original_price && p.original_price > p.price && (
              <><span className="price-original">₹{p.original_price}</span><span className="discount-badge">{discount}% OFF</span></>
            )}
          </div>
          <button className={`add-to-cart-btn ${added ? 'added' : ''}`} onClick={addToCart}
                  aria-label={`Add ${p.name} to cart`} style={added ? {background:'var(--green)'} : {}}>
            {added ? '✓' : '+'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [displayLimit, setDisplayLimit] = useState(8);
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const searchTimeout = useRef(null);

  const updateCartCount = () => setCartCount(Cart.count());

  useEffect(() => {
    updateCartCount();
    fetch('/api/products')
      .then(r => r.json())
      .then(data => { setProducts(data); setFiltered(data); setLoading(false); })
      .catch(() => setLoading(false));

    // Navbar scroll
    const onScroll = () => document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });

    // Reveal observer
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => obs.observe(el));

    // Preloader
    const bar = document.getElementById('loaderBar');
    if (bar) { bar.style.width = '100%'; }
    setTimeout(() => {
      const pl = document.getElementById('preloader');
      if (pl) { pl.style.opacity = '0'; setTimeout(() => { if (pl) pl.style.display = 'none'; }, 500); }
    }, 600);

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let result = [...products];
    if (category !== 'All') result = result.filter(p => p.category === category);
    if (search) {
      const q = search.toLowerCase();
      // Search by product name only
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }
    setFiltered(result);
    setDisplayLimit(8);
  }, [category, search, products]);

  const filterCategory = (cat) => {
    setCategory(cat);
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    if (val.length >= 2) {
      searchTimeout.current = setTimeout(() => {
        const matches = products.filter(p => p.name.toLowerCase().includes(val.toLowerCase())).slice(0, 6);
        setSuggestions(matches);
      }, 200);
    } else {
      setSuggestions([]);
    }
  };

  const reviews = [
    { name: 'Priya Sharma', rating: 5, comment: 'Absolutely authentic taste! Reminds me of my grandmother\'s pickle. Will definitely order again!', product: 'Andhra Mango Pickle', city: 'Hyderabad', date: '3 days ago' },
    { name: 'Rajesh Kumar', rating: 5, comment: 'Best mango pickle I\'ve ever tasted. Perfect spice level and excellent packaging.', product: 'Andhra Mango Pickle', city: 'Bangalore', date: '1 week ago' },
    { name: 'Anjali Reddy', rating: 4, comment: 'Love the sweet-tangy balance of the lemon pickle. My whole family enjoyed it!', product: 'Sweet Lemon Pickle', city: 'Chennai', date: '2 weeks ago' },
    { name: 'Suresh Babu', rating: 5, comment: 'The mixed pickle is amazing! Fresh vegetables and perfect spices. No leaks at all!', product: 'Mixed Vegetable Pickle', city: 'Vijayawada', date: '1 month ago' },
    { name: 'Lakshmi Devi', rating: 5, comment: 'Thokku is outstanding! Just like homemade. I order every month without fail!', product: 'Raw Mango Thokku', city: 'Tirupati', date: '1 month ago' },
    { name: 'Venkat Rao', rating: 5, comment: 'Exceptional quality! You can taste the authenticity in every bite. 100% recommend!', product: 'Garlic Pickle', city: 'Guntur', date: '2 months ago' },
  ];

  const displayed = filtered.slice(0, displayLimit);

  return (
    <>
      {/* Preloader */}
      <div id="preloader" style={{position:'fixed',inset:0,background:'var(--cream)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,transition:'opacity 0.5s ease'}}>
        <img src="/images/logo.png" alt="Gowri Pickles" width="80" height="80" style={{borderRadius:'50%'}} />
        <div style={{fontFamily:'var(--font-heading)',fontSize:'1.4rem',color:'var(--red)',fontWeight:700}}>Gowri Pickles</div>
        <div style={{width:160,height:3,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
          <div id="loaderBar" style={{height:'100%',background:'var(--grad-hero)',width:0,transition:'width 0.8s ease',borderRadius:3}}></div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="navbar" id="navbar" role="navigation" aria-label="Main Navigation">
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            <img src="/images/logo.png" alt="Gowri Pickles Logo" width="48" height="48" onError={e => e.target.style.display='none'} />
            <div className="nav-logo-text">
              <span className="brand-name">Gowri Pickles</span>
              <span className="brand-tagline">Pure • Traditional • Authentic</span>
            </div>
          </a>
          <div className="nav-links">
            <a href="/" aria-current="page">Home</a>
            <a href="#products">Products</a>
            <a href="#categories">Categories</a>
            <a href="#about">About Us</a>
            <a href="#reviews">Reviews</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="nav-actions">
            <a href="/cart" className="cart-icon-btn" aria-label="Shopping Cart">
              🛒 Cart <span className="cart-badge" id="cartBadge" style={{display: cartCount > 0 ? 'flex' : 'none'}}>{cartCount}</span>
            </a>
            <button className={`hamburger ${menuOpen ? 'active' : ''}`} aria-label="Toggle Menu" aria-expanded={menuOpen}
                    onClick={() => setMenuOpen(!menuOpen)}>
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <a href="/" onClick={() => setMenuOpen(false)}>Home</a>
        <a href="#products" onClick={() => setMenuOpen(false)}>Products</a>
        <a href="#categories" onClick={() => setMenuOpen(false)}>Categories</a>
        <a href="#about" onClick={() => setMenuOpen(false)}>About Us</a>
        <a href="#reviews" onClick={() => setMenuOpen(false)}>Reviews</a>
        <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        <a href="/cart" style={{background:'var(--red)',color:'white',textAlign:'center',borderRadius:50,marginTop:8}}>View Cart ({cartCount})</a>
      </div>

      {/* Hero */}
      <section className="hero" id="home" aria-label="Hero Section">
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#7B1818 0%,#C0392B 35%,#D35400 70%,#F39C12 100%)'}}></div>
        <div style={{position:'absolute',top:-200,right:-200,width:600,height:600,borderRadius:'50%',background:'rgba(255,255,255,0.04)',pointerEvents:'none'}}></div>
        <div style={{position:'absolute',bottom:-150,left:-150,width:400,height:400,borderRadius:'50%',background:'rgba(255,255,255,0.04)',pointerEvents:'none'}}></div>
        <div className="container" style={{position:'relative',zIndex:2,display:'grid',gridTemplateColumns:'1fr 1fr',gap:40,alignItems:'center',paddingTop:40,paddingBottom:60}}>
          <div className="hero-content">
            <div className="hero-badge" style={{animation:'slide-down 0.6s ease both'}}>
              <span className="dot"></span> Crafted with Love &amp; Tradition Since 1995
            </div>
            <h1 style={{animation:'slide-up 0.7s ease 0.1s both'}}>
              India&apos;s Most <span className="highlight">Authentic Pickles</span> At Your Door!
            </h1>
            <p className="hero-desc" style={{animation:'slide-up 0.7s ease 0.2s both'}}>
              From our kitchen to your table — experience bold flavors of traditional Andhra-style pickles made with hand-picked ingredients, time-tested recipes &amp; zero artificial preservatives.
            </p>
            <div className="hero-actions" style={{animation:'slide-up 0.7s ease 0.3s both'}}>
              <a href="#products" className="btn btn-lg" style={{background:'white',color:'var(--red)',fontWeight:700,boxShadow:'0 8px 30px rgba(0,0,0,0.2)'}}>Shop Now</a>
              <a href="#about" className="btn btn-lg" style={{background:'rgba(255,255,255,0.15)',color:'white',border:'2px solid rgba(255,255,255,0.5)',backdropFilter:'blur(4px)'}}>Our Story</a>
            </div>
            <div className="hero-stats" style={{animation:'slide-up 0.7s ease 0.4s both'}}>
              <div className="hero-stat"><div className="number">10K+</div><div className="label">Happy Customers</div></div>
              <div className="hero-stat"><div className="number">25+</div><div className="label">Pickle Varieties</div></div>
              <div className="hero-stat"><div className="number">30+</div><div className="label">Years of Tradition</div></div>
            </div>
          </div>
          <div style={{animation:'float 6s ease-in-out infinite, slide-up 0.8s ease 0.2s both',display:'flex',justifyContent:'center',alignItems:'center'}}>
            <div style={{position:'relative'}}>
              <div style={{position:'absolute',inset:-20,borderRadius:'50%',background:'rgba(255,255,255,0.1)',animation:'pulse 3s ease infinite'}}></div>
              <img src="/images/mixed_pickle.png" alt="Authentic Indian Pickles by Gowri Pickles"
                   style={{width:'100%',maxWidth:480,borderRadius:24,boxShadow:'0 40px 80px rgba(0,0,0,0.4)',position:'relative',zIndex:1}}
                   onError={e => e.target.src='/images/mango_pickle.png'} />
              <div style={{position:'absolute',top:20,left:-20,background:'white',borderRadius:12,padding:'10px 16px',boxShadow:'0 8px 24px rgba(0,0,0,0.15)',fontFamily:'var(--font-ui)',fontSize:'0.82rem',fontWeight:700,color:'var(--green-dark)',animation:'float 4s ease-in-out infinite'}}>✅ 100% Natural</div>
              <div style={{position:'absolute',bottom:40,right:-20,background:'var(--yellow)',borderRadius:12,padding:'10px 16px',boxShadow:'0 8px 24px rgba(243,156,18,0.4)',fontFamily:'var(--font-ui)',fontSize:'0.82rem',fontWeight:700,color:'var(--text-dark)',animation:'float 4s ease-in-out 1s infinite'}}>🌶️ Spice Guaranteed!</div>
            </div>
          </div>
        </div>
        <div className="hero-scroll" aria-hidden="true"><div className="scroll-wheel"></div><span>Scroll to explore</span></div>
      </section>

      {/* Trust Bar */}
      <div className="trust-bar" aria-label="Trust signals">
        <div className="container">
          <div className="trust-items">
            {[['Free Delivery Above ₹500'],['100% Natural Ingredients'],['Secure Payments'],['Hygienic Packaging'],['4.8 Star Rating']].map(([text],i,arr) => (
              <>
                <div key={text} className="trust-item"><span className="trust-icon" style={{color:'var(--red)'}}>{i===0?'▶':i===1?'▶':i===2?'▶':i===3?'▶':'▶'}</span>{text}</div>
                {i < arr.length - 1 && <div style={{color:'var(--border)'}}>|</div>}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Features Strip */}
      <div className="features-strip" aria-label="Features" style={{overflow:'hidden'}}>
        <div className="features-ticker">
          {['Free Delivery Above ₹500','100% Natural Ingredients','Traditional Recipes Since 1995','4.8 Star Rating','Secure Payments','Hygienic Packaging','No Artificial Preservatives','Award-Winning Quality'].flatMap((item, i, arr) => [
            <div key={i} className="feature-item">{item}</div>
          ])}
        </div>
      </div>

      {/* Categories */}
      <section className="categories-section" id="categories" aria-labelledby="cat-heading" style={{background:'white'}}>
        <div className="container">
          <div className="reveal" style={{textAlign:'center'}}>
            <div className="section-eyebrow"><div className="eyebrow-line"></div><span className="eyebrow-text">Browse Our Range</span><div className="eyebrow-line"></div></div>
            <h2 className="section-title" id="cat-heading">Browse by <span>Category</span></h2>
            <p className="section-subtitle">From fiery hot to mildly tangy — a pickle for every palate</p>
          </div>
          <div className="categories-grid reveal">
            {[{cat:'Mango'},{cat:'Lemon'},{cat:'Chilli'},{cat:'Mixed'},{cat:'Special'}].map(({cat}) => (
              <div key={cat} className={`category-card ${cat.toLowerCase()}`} onClick={() => filterCategory(cat)} tabIndex={0} role="button" aria-label={`${cat} Pickles`}
                   onKeyPress={e => e.key === 'Enter' && filterCategory(cat)}>
                <div className="category-name">{cat}</div>
                <div className="category-count">{products.filter(p => p.category === cat).length} Varieties</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="steps-section" aria-labelledby="steps-heading">
        <div className="container">
          <div className="reveal" style={{textAlign:'center',marginBottom:50}}>
            <div className="section-eyebrow"><div className="eyebrow-line"></div><span className="eyebrow-text">Simple as 1-2-3</span><div className="eyebrow-line"></div></div>
            <h2 className="section-title" id="steps-heading">How to <span>Order</span></h2>
          </div>
          <div className="steps-grid reveal">
            {[['Browse & Choose','Explore our wide range of authentic pickles and choose your favorites'],['Add to Cart','Add items to cart, apply promo codes for extra discounts'],['Checkout Securely','Fill in your address and choose from multiple payment options'],['Enjoy Delivery!','Your pickles arrive fresh in 3–5 days in secure, leak-proof packaging']].map(([title,desc],i) => (
              <div key={i} className="step-card">
                <div className="step-num">{i+1}</div>
                <div className="step-title">{title}</div>
                <div className="step-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="products-section" id="products" aria-labelledby="prod-heading" style={{background:'var(--cream)'}}>
        <div className="container">
          <div className="reveal" style={{textAlign:'center'}}>
            <div className="section-eyebrow"><div className="eyebrow-line"></div><span className="eyebrow-text">Fresh from Our Kitchen</span><div className="eyebrow-line"></div></div>
            <h2 className="section-title" id="prod-heading">Our <span>Pickle Collection</span></h2>
            <p className="section-subtitle">Handcrafted with love — every jar tells a story of tradition</p>
          </div>
          <div className="filter-bar reveal">
            <div className="filter-tabs" id="filterTabs" role="tablist">
              {['All','Mango','Lemon','Chilli','Mixed','Special'].map(cat => (
                <button key={cat} className={`filter-tab ${category === cat ? 'active' : ''}`} role="tab" aria-selected={category === cat}
                        onClick={() => filterCategory(cat)}>
                  {cat === 'All' ? 'All Pickles' : cat}
                </button>
              ))}
            </div>
            <div className="search-box" style={{position:'relative'}}>
              <input type="search" id="searchInput" placeholder="Search pickles..." aria-label="Search products" autoComplete="off"
                     value={search} onChange={e => handleSearch(e.target.value)}
                     onKeyDown={e => e.key === 'Escape' && (setSearch(''), setSuggestions([]))} />
              {suggestions.length > 0 && (
                <div className="search-suggestions visible" role="listbox">
                  {suggestions.map(p => (
                    <div key={p.id} className="suggestion-item" onClick={() => window.location.href = `/product/${p.id}`} role="option" tabIndex={0}>
                      <img src={p.image} alt={p.name} onError={e => e.target.src='/images/mango_pickle.png'} />
                      <div><div style={{fontWeight:600,fontSize:'0.9rem'}}>{p.name}</div><div style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>₹{p.price} • {p.category}</div></div>
                      <div style={{marginLeft:'auto',fontWeight:700,color:'var(--red)'}}>₹{p.price}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="products-grid" aria-live="polite">
            {loading ? (
              [1,2,3,4].map(i => (
                <div key={i} className="skeleton-card"><div className="skeleton skeleton-img"></div><div className="skeleton-body"><div className="skeleton skeleton-line long"></div><div className="skeleton skeleton-line short"></div><div className="skeleton skeleton-line long"></div></div></div>
              ))
            ) : displayed.length === 0 ? (
              <div className="empty-state" style={{gridColumn:'1/-1'}}>
                <h3>No pickles found</h3>
                <p>Try a different search or category.</p>
                <button className="btn btn-secondary" onClick={() => { setCategory('All'); setSearch(''); }}>Show All</button>
              </div>
            ) : displayed.map((p, i) => (
              <ProductCard key={p.id} p={p} onCartUpdate={updateCartCount} />
            ))}
          </div>
          {filtered.length > displayLimit && (
            <div style={{textAlign:'center',marginTop:48}} className="reveal">
              <button className="btn btn-secondary btn-lg" onClick={() => setDisplayLimit(l => l + 8)}>Load More Pickles ↓</button>
            </div>
          )}
        </div>
      </section>

      {/* Marquee */}
      <div className="brand-marquee" aria-hidden="true">
        <div className="marquee-inner">
          {['Award Winning Quality','Farm Fresh Ingredients','No Artificial Preservatives','Grandmother\'s Recipe','Pan India Delivery','Made with Love','Award Winning Quality','Farm Fresh Ingredients','No Artificial Preservatives','Grandmother\'s Recipe','Pan India Delivery','Made with Love'].map((item, i) => (
            <div key={i} className="marquee-item">{item}</div>
          ))}
        </div>
      </div>

      {/* About */}
      <section className="about-section" id="about" aria-labelledby="about-heading">
        <div className="container">
          <div className="about-grid">
            <div className="about-image reveal-left">
              <img src="/images/mango_pickle.png" alt="Traditional Indian pickle making at Gowri Pickles" loading="lazy" />
              <div className="about-image-frame" aria-hidden="true"></div>
              <div className="about-years-badge" aria-label="30 years of tradition">
                <span className="years">30</span><span className="text">YEARS OF<br/>TRADITION</span>
              </div>
            </div>
            <div className="about-content reveal-right">
              <div className="section-eyebrow" style={{justifyContent:'flex-start'}}><div className="eyebrow-line"></div><span className="eyebrow-text">Our Story</span></div>
              <h2 id="about-heading" style={{fontSize:'2.4rem',marginBottom:20}}>A Labour of <span style={{color:'var(--red)'}}>Love</span> and Tradition</h2>
              <p>Born in a small kitchen in Andhra Pradesh in 1995, Gowri Pickles started as a passion project by our founder, Mrs. Gowri Devi, who wanted to share her mother&apos;s treasured pickle recipes with the world.</p>
              <p>What began as a family tradition has blossomed into a beloved brand trusted by over 10,000 families across India. Every jar we make carries the same love, care, and authentic spices that our grandmother used decades ago.</p>
              <p>We source raw mangoes from local Andhra Pradesh farms, chillies from Guntur — the spice capital of India — and use only cold-pressed sesame oil. <strong>No shortcuts, no artificial colors, no preservatives — ever.</strong></p>
              <div className="about-features">
                {[['100% Natural','No artificial additives'],['Traditional Recipe','Passed down through generations'],['Safe Packaging','Food-grade, leak-proof containers'],['Fast Delivery','Pan India in 3–5 days']].map(([title,desc]) => (
                  <div key={title} className="about-feature"><div><div className="feat-title">{title}</div><div className="feat-desc">{desc}</div></div></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="reviews-section" id="reviews" aria-labelledby="review-heading">
        <div className="container">
          <div className="reveal" style={{textAlign:'center'}}>
            <div className="section-eyebrow"><div className="eyebrow-line"></div><span className="eyebrow-text">Customer Love</span><div className="eyebrow-line"></div></div>
            <h2 className="section-title" id="review-heading">What Our <span>Customers Say</span></h2>
            <p className="section-subtitle">10,000+ happy families trust Gowri Pickles every month!</p>
          </div>
          <div className="reviews-grid" id="reviewsGrid">
            {reviews.map((r, i) => {
              const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
              const initials = r.name.split(' ').map(n => n[0]).join('');
              return (
                <article key={i} className="review-card reveal" itemScope itemType="https://schema.org/Review">
                  <div className="review-header">
                    <div className="review-avatar" aria-hidden="true" style={{background:'var(--grad-hero)'}}>{initials}</div>
                    <div style={{flex:1}}><div className="reviewer-name" itemProp="author">{r.name}</div><div className="review-date">{r.city} &middot; {r.date}</div></div>
                    <div className="stars" aria-label={`${r.rating} out of 5 stars`}>{stars}</div>
                  </div>
                  <p className="review-text" itemProp="reviewBody">&ldquo;{r.comment}&rdquo;</p>
                  <div className="review-product">Ordered: <strong>{r.product}</strong></div>
                  <div style={{marginTop:10,fontSize:'0.8rem',color:'var(--green)',fontWeight:600}}>✓ Verified Purchase</div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter-section" aria-labelledby="newsletter-heading">
        <div className="container newsletter-content">
          <div className="reveal">
            <h2 id="newsletter-heading">Get Exclusive Pickle Deals!</h2>
            <p>Subscribe &amp; get <strong>15% OFF</strong> your first order + pickle recipes, seasonal offers &amp; more!</p>
            <form className="newsletter-form" onSubmit={e => {
              e.preventDefault();
              const btn = e.target.querySelector('button');
              btn.textContent = '✅ Subscribed!';
              btn.style.background = 'var(--green)';
              showToast('🎉','Welcome!','Your discount code: WELCOME15');
              setTimeout(() => { btn.textContent = 'Subscribe Free!'; btn.style.background = ''; e.target.reset(); }, 4000);
            }}>
              <input type="email" placeholder="Enter your email address" required aria-label="Email for newsletter" />
              <button type="submit" className="btn btn-lg" style={{background:'white',color:'var(--red)',fontWeight:700}}>Subscribe Free!</button>
            </form>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{padding:'80px 0',background:'white'}} aria-labelledby="contact-heading">
        <div className="container">
          <div className="reveal" style={{textAlign:'center',marginBottom:50}}>
            <div className="section-eyebrow"><div className="eyebrow-line"></div><span className="eyebrow-text">Get In Touch</span><div className="eyebrow-line"></div></div>
            <h2 className="section-title" id="contact-heading">We&apos;d Love to <span>Hear From You</span></h2>
            <p className="section-subtitle">Have a question about our pickles? We&apos;re always here to help!</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:24}} className="reveal">
            {[
              [null,'Call Us','+91 9515258527','Mon–Sat, 9AM–7PM','phone'],
              [null,'Email Us','orders@gowripickles.com','Reply within 24 hours','mail'],
              ['wa','WhatsApp','Chat Now →','Instant response','message-circle'],
              [null,'Visit Us','Adharsh Nagar, Sector 8, Near Ushodhaya Sarvani Sweets, MVP Colony, Pedda Waltair, Visakhapatnam, AP – 530017','','map-pin']
            ].map(([special,title,line1,line2,icon]) => (
              <div key={title} style={{background:'var(--cream)',borderRadius:20,padding:'36px 24px',textAlign:'center',border:'1px solid var(--border)',transition:'all 0.3s ease',cursor:'default'}}
                   onMouseOver={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow='0 20px 40px rgba(192,57,43,0.1)'; }}
                   onMouseOut={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
                <div style={{width:64,height:64,background:title==='WhatsApp'?'#25D366':'#D35400',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem',margin:'0 auto 16px',color:'white'}}>{icon}</div>
                <h3 style={{fontSize:'1.05rem',marginBottom:8}}>{title}</h3>
                {title === 'Call Us' ? <a href="tel:+919515258527" style={{color:'var(--text-muted)',fontSize:'0.9rem',fontWeight:600,textDecoration:'none'}}>{line1}</a> : title === 'WhatsApp' ? <a href="https://wa.me/919515258527?text=Hi!%20I%20want%20to%20order%20Gowri%20Pickles" target="_blank" style={{color:'var(--green)',fontWeight:700,fontSize:'0.9rem',textDecoration:'none'}}>{line1}</a> : <p style={{color:'var(--text-muted)',fontSize:'0.9rem',fontWeight:600}}>{line1}</p>}
                <p style={{color:'var(--text-muted)',fontSize:'0.82rem',marginTop:4}}>{line2}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" role="contentinfo">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="brand"><img src="/images/logo.png" alt="Gowri Pickles" width="48" height="48" onError={e => e.target.style.display='none'} /><span className="brand-name">Gowri Pickles</span></div>
              <p>Crafting authentic Indian pickles with love and tradition since 1995.</p>
              <div className="social-links">
                {['📘','📷','📺','💬'].map((icon, i) => <a key={i} href="#" className="social-link" aria-label={['Facebook','Instagram','YouTube','WhatsApp'][i]}>{icon}</a>)}
              </div>
            </div>
            <div className="footer-col"><h4>Quick Links</h4><ul><li><a href="/">Home</a></li><li><a href="#products">All Products</a></li><li><a href="#about">Our Story</a></li><li><a href="#reviews">Reviews</a></li><li><a href="#contact">Contact</a></li></ul></div>
            <div className="footer-col"><h4>Categories</h4><ul>{['Mango','Lemon','Chilli','Mixed','Special'].map(cat => <li key={cat}><a href="#products" onClick={() => filterCategory(cat)}>{cat === 'Mango' ? '🥭' : cat === 'Lemon' ? '🍋' : cat === 'Chilli' ? '🌶️' : cat === 'Mixed' ? '🥗' : '✨'} {cat} Pickles</a></li>)}</ul></div>
            <div className="footer-col"><h4>Contact Info</h4>
              <div className="footer-contact-item"><span className="icon">&#128205;</span><span>Adharsh Nagar, Sector 8, Near Ushodhaya Sarvani Sweets, MVP Colony, Pedda Waltair, Visakhapatnam, AP – 530017</span></div>
              <div className="footer-contact-item"><span className="icon">&#128222;</span><span>+91 9515258527</span></div>
              <div className="footer-contact-item"><span className="icon">&#128231;</span><span>orders@gowripickles.com</span></div>
              <div className="footer-contact-item"><span className="icon">&#8987;</span><span>Mon–Sat: 9AM – 7PM IST</span></div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Gowri Pickles. All rights reserved. Made with love in India.</p>
            <div className="footer-bottom-links">
              <a href="#">Privacy Policy</a><a href="#">Terms of Service</a><a href="#">Shipping Policy</a><a href="/admin">Admin</a>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Float */}
      <a href="https://wa.me/919515258527?text=Hi!%20I%20want%20to%20order%20Gowri%20Pickles" className="whatsapp-float" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>

      {/* Toast */}
      <div className="toast-container" id="toastContainer" aria-live="assertive" aria-atomic="true"></div>
    </>
  );
}

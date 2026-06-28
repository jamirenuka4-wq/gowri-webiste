'use client';
import { useEffect, useState } from 'react';

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

function showToast(icon, title, desc) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span class="toast-icon">${icon}</span><div class="toast-text"><div class="toast-title">${title}</div>${desc ? `<div class="toast-desc">${desc}</div>` : ''}</div>`;
  container.appendChild(t);
  setTimeout(() => t?.parentElement && t.remove(), 4000);
}

export default function ProductPage({ params }) {
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [loading, setLoading] = useState(true);

  const updateCartCount = () => setCartCount(Cart.count());

  useEffect(() => {
    updateCartCount();
    const onScroll = () => document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });

    fetch(`/api/products/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) return;
        const { reviews: rv, ...prod } = data;
        setProduct(prod);
        setReviews(rv || []);
        setLoading(false);
        // Fetch related
        fetch(`/api/products?category=${prod.category}`)
          .then(r => r.json())
          .then(all => setRelated(all.filter(p => p.id !== prod.id).slice(0, 4)));
      }).catch(() => setLoading(false));

    return () => window.removeEventListener('scroll', onScroll);
  }, [params.id]);

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--cream)'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:60,height:60,border:'4px solid var(--border)',borderTopColor:'var(--red)',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 16px'}}></div>
        <p style={{color:'var(--text-muted)'}}>Loading product...</p>
      </div>
    </div>
  );

  if (!product) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
      <div style={{fontSize:'4rem'}}>🥫</div>
      <h2>Product not found</h2>
      <a href="/" className="btn btn-primary">← Back to Store</a>
    </div>
  );

  const images = [product.image, '/images/mango_pickle.png', '/images/lemon_pickle.png'].filter(Boolean);
  const discount = product.original_price > product.price ? Math.round((1 - product.price / product.original_price) * 100) : 0;
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

  const addToCart = () => {
    Cart.add(product, qty);
    updateCartCount();
    showToast('✅', `${qty}x ${product.name} added!`, `Total: ₹${product.price * qty}`);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    const r = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: product.id, customer_name: reviewName, rating: reviewRating, comment: reviewComment }) });
    if (r.ok) {
      setReviews(prev => [{ customer_name: reviewName, rating: reviewRating, comment: reviewComment, created_at: new Date().toISOString() }, ...prev]);
      setReviewName(''); setReviewComment(''); setReviewRating(5);
      showToast('🌟', 'Review submitted!', 'Thank you for your feedback.');
    }
  };

  return (
    <>
      <nav className="navbar scrolled" id="navbar">
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            <img src="/images/logo.png" alt="Gowri Pickles" width="48" height="48" onError={e => e.target.style.display='none'} />
            <div className="nav-logo-text"><span className="brand-name">Gowri Pickles</span><span className="brand-tagline">Pure • Traditional • Authentic</span></div>
          </a>
          <div className="nav-links"><a href="/">Home</a><a href="/#products">Products</a><a href="/#about">About</a><a href="/#contact">Contact</a></div>
          <div className="nav-actions">
            <a href="/cart" className="cart-icon-btn">🛒 Cart <span className="cart-badge" style={{display:cartCount>0?'flex':'none'}}>{cartCount}</span></a>
          </div>
        </div>
      </nav>

      <div className="product-page" style={{paddingTop:80}}>
        <div className="container">
          <nav aria-label="Breadcrumb" style={{marginBottom:28,fontSize:'0.85rem',color:'var(--text-muted)',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <a href="/" style={{color:'var(--text-muted)',textDecoration:'none'}}>Home</a> <span>›</span>
            <a href="/#products" style={{color:'var(--text-muted)',textDecoration:'none'}}>Products</a> <span>›</span>
            <a href="/#products" style={{color:'var(--text-muted)',textDecoration:'none'}}>{product.category}</a> <span>›</span>
            <span style={{color:'var(--text-dark)',fontWeight:600}}>{product.name}</span>
          </nav>

          <div className="product-layout">
            {/* Gallery */}
            <div className="product-gallery">
              <div className="main-image-wrap" style={{borderRadius:20,overflow:'hidden',background:'white',border:'1px solid var(--border)',padding:20,marginBottom:16}}>
                <img src={images[activeImg]} alt={product.name} style={{width:'100%',borderRadius:12,transition:'opacity 0.3s',objectFit:'contain',maxHeight:400}}
                     onError={e => e.target.src='/images/mango_pickle.png'} />
              </div>
              <div style={{display:'flex',gap:10}}>
                {images.map((img, i) => (
                  <div key={i} onClick={() => setActiveImg(i)} style={{width:80,height:80,borderRadius:10,overflow:'hidden',border:`2px solid ${i===activeImg?'var(--red)':'var(--border)'}`,cursor:'pointer',flexShrink:0,background:'white',padding:4,transition:'border 0.2s'}}>
                    <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'contain'}} onError={e => e.target.src='/images/mango_pickle.png'} />
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="product-details">
              {product.featured && <span className="card-badge badge-bestseller" style={{display:'inline-flex',marginBottom:12}}>⭐ Bestseller</span>}
              <div style={{color:'var(--text-muted)',fontSize:'0.85rem',fontWeight:600,marginBottom:8,textTransform:'uppercase',letterSpacing:2}}>{product.category} Pickle</div>
              <h1 style={{fontSize:'2rem',marginBottom:12,fontFamily:'var(--font-heading)'}}>{product.name}</h1>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <span style={{color:'var(--yellow)',fontSize:'1.2rem'}}>{stars(Math.round(product.rating))}</span>
                <span style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>{product.rating} ({product.reviews_count} reviews)</span>
              </div>
              <p style={{color:'var(--text-body)',lineHeight:1.8,marginBottom:24}}>{product.description}</p>

              {/* Price */}
              <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24,padding:'20px 24px',background:'var(--cream)',borderRadius:16,border:'1px solid var(--border)'}}>
                <span style={{fontSize:'2.2rem',fontWeight:900,color:'var(--text-dark)',fontFamily:'var(--font-heading)'}}>₹{product.price}</span>
                {discount > 0 && <><span style={{color:'var(--text-muted)',textDecoration:'line-through',fontSize:'1.3rem'}}>₹{product.original_price}</span><span style={{background:'var(--red)',color:'white',borderRadius:8,padding:'4px 10px',fontSize:'0.85rem',fontWeight:700}}>{discount}% OFF</span></>}
              </div>

              {/* Meta */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24}}>
                {[['⚖️','Weight',product.weight],['🌶️','Spice Level',product.spice_level],['📅','Shelf Life',product.shelf_life],['✅','Status',product.in_stock?'In Stock':'Out of Stock']].map(([icon,label,val]) => (
                  <div key={label} style={{background:'var(--cream)',borderRadius:12,padding:'12px 16px',border:'1px solid var(--border)'}}>
                    <div style={{fontSize:'0.75rem',color:'var(--text-muted)',marginBottom:4}}>{icon} {label}</div>
                    <div style={{fontWeight:700,fontSize:'0.9rem',color:label==='Status'?(product.in_stock?'var(--green)':'var(--red)'):'var(--text-dark)'}}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Qty + Cart */}
              {product.in_stock ? (
                <div style={{display:'flex',gap:16,marginBottom:24,flexWrap:'wrap'}}>
                  <div style={{display:'flex',alignItems:'center',border:'2px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
                    <button onClick={() => setQty(q => Math.max(1, q-1))} style={{padding:'12px 18px',background:'none',border:'none',cursor:'pointer',fontSize:'1.2rem',fontWeight:700}}>−</button>
                    <span style={{padding:'12px 20px',fontWeight:700,fontSize:'1.1rem',borderLeft:'1px solid var(--border)',borderRight:'1px solid var(--border)'}}>{qty}</span>
                    <button onClick={() => setQty(q => Math.min(10, q+1))} style={{padding:'12px 18px',background:'none',border:'none',cursor:'pointer',fontSize:'1.2rem',fontWeight:700}}>+</button>
                  </div>
                  <button className="btn btn-primary btn-lg" onClick={addToCart} style={{flex:1,minWidth:200,justifyContent:'center'}}>🛒 Add to Cart – ₹{product.price * qty}</button>
                </div>
              ) : (
                <div style={{background:'#fff0f0',border:'2px solid var(--red)',borderRadius:12,padding:'16px 20px',marginBottom:24,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{color:'var(--red)',fontWeight:700}}>❌ Out of Stock</span>
                  <a href={`https://wa.me/919876543210?text=Hi! Notify me when ${product.name} is back in stock.`} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{background:'#25D366',color:'white'}}>💬 Notify Me</a>
                </div>
              )}

              <button className="btn btn-lg" style={{width:'100%',background:'var(--green)',color:'white',justifyContent:'center',marginBottom:24}} onClick={() => { addToCart(); window.location.href='/checkout'; }}>⚡ Buy Now – Direct Checkout</button>

              {/* Share */}
              <div style={{display:'flex',gap:12,marginBottom:24}}>
                <a href={`https://wa.me/?text=Check out ${product.name} at Gowri Pickles! ₹${product.price} – ${window?.location?.href||''}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{background:'#25D366',color:'white'}}>📲 WhatsApp</a>
                <button className="btn btn-sm btn-secondary" onClick={() => { navigator.clipboard.writeText(window.location.href); showToast('🔗','Link copied!','Share with friends!'); }}>🔗 Copy Link</button>
              </div>

              {/* Ingredients */}
              {product.ingredients && (
                <div style={{background:'var(--cream)',borderRadius:12,padding:'16px 20px',border:'1px solid var(--border)'}}>
                  <div style={{fontWeight:700,marginBottom:6,color:'var(--text-dark)'}}>🌿 Ingredients</div>
                  <p style={{fontSize:'0.88rem',color:'var(--text-muted)',lineHeight:1.6}}>{product.ingredients}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div style={{marginTop:60}}>
            <h2 style={{fontSize:'1.8rem',marginBottom:30,fontFamily:'var(--font-heading)'}}>Customer Reviews ({reviews.length})</h2>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:20,marginBottom:40}}>
              {reviews.map((r, i) => (
                <div key={i} style={{background:'white',borderRadius:16,padding:24,border:'1px solid var(--border)',boxShadow:'var(--shadow-card)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                    <strong>{r.customer_name}</strong>
                    <span style={{color:'var(--yellow)'}}>{stars(r.rating)}</span>
                  </div>
                  <p style={{color:'var(--text-body)',fontSize:'0.9rem',lineHeight:1.7}}>"{r.comment}"</p>
                  <div style={{marginTop:8,fontSize:'0.78rem',color:'var(--green)',fontWeight:600}}>✓ Verified Purchase</div>
                </div>
              ))}
            </div>
            {/* Review form */}
            <div style={{background:'white',borderRadius:20,padding:32,border:'1px solid var(--border)',maxWidth:600}}>
              <h3 style={{marginBottom:20}}>Write a Review</h3>
              <form onSubmit={submitReview}>
                <input className="form-input" type="text" placeholder="Your Name" required value={reviewName} onChange={e=>setReviewName(e.target.value)} style={{marginBottom:12}} />
                <div style={{marginBottom:12}}>
                  <label style={{fontSize:'0.88rem',color:'var(--text-muted)',marginBottom:6,display:'block'}}>Rating</label>
                  <div style={{display:'flex',gap:8}}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={()=>setReviewRating(n)} style={{fontSize:'1.5rem',background:'none',border:'none',cursor:'pointer',color:n<=reviewRating?'var(--yellow)':'var(--border)'}}>★</button>
                    ))}
                  </div>
                </div>
                <textarea className="form-input" placeholder="Share your experience..." rows={4} required value={reviewComment} onChange={e=>setReviewComment(e.target.value)} style={{marginBottom:16,resize:'vertical'}} />
                <button type="submit" className="btn btn-primary">🌟 Submit Review</button>
              </form>
            </div>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div style={{marginTop:60}}>
              <h2 style={{fontSize:'1.8rem',marginBottom:30,fontFamily:'var(--font-heading)'}}>More from {product.category} Pickles</h2>
              <div className="products-grid">
                {related.map(p => {
                  const d = p.original_price > p.price ? Math.round((1-p.price/p.original_price)*100) : 0;
                  return (
                    <article key={p.id} className="product-card">
                      <div className="product-card-image">
                        <a href={`/product/${p.id}`}><img src={p.image} alt={p.name} loading="lazy" onError={e=>e.target.src='/images/mango_pickle.png'} /></a>
                        {d>0 && <span className="card-badge badge-sale">🏷️ {d}% OFF</span>}
                      </div>
                      <div className="product-card-body">
                        <div className="product-category">{p.category}</div>
                        <h3><a href={`/product/${p.id}`} style={{color:'inherit',textDecoration:'none'}}>{p.name}</a></h3>
                        <div className="product-price-row">
                          <span className="price">₹{p.price}</span>
                          <button className="add-to-cart-btn" onClick={() => { Cart.add(p,1); updateCartCount(); showToast('✅',`${p.name} added!`,''); }}>+</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="footer" role="contentinfo" style={{marginTop:80}}>
        <div className="container">
          <div className="footer-bottom"><p>© 2024 Gowri Pickles. All rights reserved. Made with ❤️ in India 🇮🇳</p></div>
        </div>
      </footer>

      <a href="https://wa.me/919876543210" className="whatsapp-float" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
      <div className="toast-container" id="toastContainer" aria-live="assertive"></div>
    </>
  );
}

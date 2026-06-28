'use client';
import { useEffect, useState } from 'react';

const Cart = {
  get: () => { try { return JSON.parse(localStorage.getItem('gowri_cart') || '[]'); } catch { return []; } },
  save: (items) => localStorage.setItem('gowri_cart', JSON.stringify(items)),
};

export default function CartPage() {
  const [items, setItems] = useState([]);

  useEffect(() => { setItems(Cart.get()); }, []);

  const subtotal = items.reduce((s, i) => s + i.price * (parseInt(i.qty)||1), 0);
  const shipping = subtotal >= 500 ? 0 : 50;
  const total = subtotal + shipping;

  const update = (id, qty) => {
    const updated = qty < 1 ? items.filter(i => i.id !== id) : items.map(i => i.id === id ? {...i, qty} : i);
    Cart.save(updated); setItems(updated);
  };

  return (
    <>
      <nav className="navbar scrolled" style={{position:'sticky',top:0}}>
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            <img src="/images/logo.png" alt="Gowri Pickles" width="48" height="48" onError={e=>e.target.style.display='none'} />
            <div className="nav-logo-text"><span className="brand-name">Gowri Pickles</span><span className="brand-tagline">Pure • Traditional • Authentic</span></div>
          </a>
        </div>
      </nav>
      <div className="cart-page-wrapper" style={{background:'var(--cream)',minHeight:'80vh',paddingTop:40,paddingBottom:80}}>
        <div className="container">
          <h1 style={{fontSize:'2rem',marginBottom:8,fontFamily:'var(--font-heading)'}}>🛒 Your Cart</h1>
          <p style={{color:'var(--text-muted)',marginBottom:32}}>{items.length} item{items.length!==1?'s':''} selected</p>
          {items.length === 0 ? (
            <div style={{textAlign:'center',padding:'80px 20px',background:'white',borderRadius:20,border:'1px solid var(--border)'}}>
              <div style={{fontSize:'5rem',marginBottom:16}}>🛒</div>
              <h2 style={{marginBottom:8}}>Your cart is empty</h2>
              <p style={{color:'var(--text-muted)',marginBottom:24}}>Add some delicious pickles to get started!</p>
              <a href="/" className="btn btn-primary btn-lg">🥫 Browse Pickles</a>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:32,alignItems:'start'}}>
              <div>
                {/* Free shipping progress */}
                {subtotal < 500 && (
                  <div style={{background:'white',borderRadius:16,padding:20,marginBottom:20,border:'1px solid var(--border)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.88rem',marginBottom:10}}>
                      <span>🚚 Add <strong>₹{500-subtotal}</strong> more for free delivery!</span>
                      <span style={{color:'var(--green)',fontWeight:700}}>{Math.round(subtotal/5)}%</span>
                    </div>
                    <div style={{height:8,background:'var(--border)',borderRadius:4,overflow:'hidden'}}>
                      <div style={{height:'100%',background:'var(--grad-hero)',width:`${Math.min(100,(subtotal/500)*100)}%`,transition:'width 0.4s',borderRadius:4}}></div>
                    </div>
                  </div>
                )}
                {items.map(item => (
                  <div key={item.id} style={{background:'white',borderRadius:16,padding:20,marginBottom:16,border:'1px solid var(--border)',display:'flex',gap:20,alignItems:'center',boxShadow:'var(--shadow-card)'}}>
                    <img src={item.image} alt={item.name} style={{width:80,height:80,objectFit:'contain',borderRadius:10,border:'1px solid var(--border)'}} onError={e=>e.target.src='/images/mango_pickle.png'} />
                    <div style={{flex:1}}>
                      <h3 style={{fontSize:'1rem',marginBottom:4}}>{item.name}</h3>
                      <div style={{fontSize:'0.82rem',color:'var(--text-muted)',marginBottom:8}}>{item.category} Pickle · {item.weight}</div>
                      <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                        <div style={{display:'flex',alignItems:'center',border:'2px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
                          <button onClick={()=>update(item.id,(parseInt(item.qty)||1)-1)} style={{padding:'6px 14px',background:'none',border:'none',cursor:'pointer',fontSize:'1rem',fontWeight:700}}>−</button>
                          <span style={{padding:'6px 14px',borderLeft:'1px solid var(--border)',borderRight:'1px solid var(--border)',fontWeight:600}}>{item.qty||1}</span>
                          <button onClick={()=>update(item.id,(parseInt(item.qty)||1)+1)} style={{padding:'6px 14px',background:'none',border:'none',cursor:'pointer',fontSize:'1rem',fontWeight:700}}>+</button>
                        </div>
                        <span style={{fontWeight:700,color:'var(--red)',fontSize:'1.05rem'}}>₹{item.price * (parseInt(item.qty)||1)}</span>
                        <button onClick={()=>update(item.id,0)} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:'1.3rem'}} aria-label="Remove">🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Order Summary */}
              <div style={{background:'white',borderRadius:20,padding:28,border:'1px solid var(--border)',boxShadow:'var(--shadow-lg)',position:'sticky',top:90}}>
                <h3 style={{marginBottom:20,fontSize:'1.2rem'}}>Order Summary</h3>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}><span style={{color:'var(--text-muted)'}}>Subtotal ({items.reduce((s,i)=>s+(parseInt(i.qty)||1),0)} items)</span><span>₹{subtotal}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}><span style={{color:'var(--text-muted)'}}>Delivery</span><span style={{color:shipping===0?'var(--green)':'inherit'}}>{shipping===0?'🆓 Free':`₹${shipping}`}</span></div>
                <div style={{height:1,background:'var(--border)',margin:'16px 0'}}></div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:24,fontWeight:700,fontSize:'1.15rem'}}><span>Total</span><span style={{color:'var(--red)'}}>₹{total}</span></div>
                <a href="/checkout" className="btn btn-primary btn-lg" style={{width:'100%',justifyContent:'center',display:'flex'}}>💳 Proceed to Checkout →</a>
                <a href="/" style={{display:'block',textAlign:'center',marginTop:12,color:'var(--text-muted)',textDecoration:'none',fontSize:'0.88rem'}}>← Continue Shopping</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

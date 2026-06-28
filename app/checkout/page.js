'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const Cart = {
  get: () => { try { return JSON.parse(localStorage.getItem('gowri_cart') || '[]'); } catch { return []; } },
  clear: () => localStorage.removeItem('gowri_cart'),
};

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name:'', email:'', phone:'', address:'', city:'', state:'', pincode:'', payment:'COD', notes:'' });
  const [loading, setLoading] = useState(false);
  const [payMethod, setPayMethod] = useState('COD');

  useEffect(() => { setItems(Cart.get()); }, []);
  const subtotal = items.reduce((s,i) => s + i.price*(parseInt(i.qty)||1), 0);
  const shipping = subtotal >= 500 ? 0 : 50;
  const total = subtotal + shipping;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return alert('Your cart is empty!');
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_name: form.name, customer_email: form.email, customer_phone: form.phone, address: form.address, city: form.city, state: form.state, pincode: form.pincode, items, subtotal, shipping, total, payment_method: payMethod, notes: form.notes }),
      });
      const data = await res.json();
      if (data.success) {
        Cart.clear();
        router.push(`/order-success?order=${data.order_number}`);
      } else { alert('Order failed. Please try again.'); setLoading(false); }
    } catch { alert('Network error. Please try again.'); setLoading(false); }
  };

  const inp = (field, placeholder, type='text', required=true) => (
    <input className="form-input" type={type} placeholder={placeholder} required={required} value={form[field]} onChange={e=>setForm({...form,[field]:e.target.value})} />
  );

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

      {loading && (
        <div style={{position:'fixed',inset:0,background:'rgba(255,255,255,0.92)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
          <div style={{width:60,height:60,border:'4px solid var(--border)',borderTopColor:'var(--red)',borderRadius:'50%',animation:'spin 1s linear infinite'}}></div>
          <p style={{fontWeight:700,color:'var(--red)',fontSize:'1.1rem'}}>Placing your order...</p>
        </div>
      )}

      <div style={{background:'var(--cream)',minHeight:'80vh',padding:'40px 0 80px'}}>
        <div className="container">
          <h1 style={{fontSize:'2rem',marginBottom:8,fontFamily:'var(--font-heading)'}}>💳 Checkout</h1>
          <p style={{color:'var(--text-muted)',marginBottom:32}}>Secure checkout · Your data is safe</p>
          <form onSubmit={handleSubmit}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:32,alignItems:'start'}}>
              <div>
                {/* Contact */}
                <div style={{background:'white',borderRadius:20,padding:28,marginBottom:24,border:'1px solid var(--border)'}}>
                  <h3 style={{marginBottom:20,display:'flex',alignItems:'center',gap:8}}><span style={{width:32,height:32,background:'var(--grad-hero)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'0.9rem'}}>1</span> Contact Details</h3>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    {inp('name','Full Name *')}
                    {inp('email','Email Address *','email')}
                    {inp('phone','Phone Number *','tel')}
                    <input className="form-input" type="text" placeholder="Notes (optional)" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
                  </div>
                </div>
                {/* Address */}
                <div style={{background:'white',borderRadius:20,padding:28,marginBottom:24,border:'1px solid var(--border)'}}>
                  <h3 style={{marginBottom:20,display:'flex',alignItems:'center',gap:8}}><span style={{width:32,height:32,background:'var(--grad-hero)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'0.9rem'}}>2</span> Delivery Address</h3>
                  <div style={{display:'grid',gap:14}}>
                    {inp('address','Full Address (House/Flat, Street, Landmark) *')}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
                      {inp('city','City *')}
                      {inp('state','State *')}
                      {inp('pincode','PIN Code *')}
                    </div>
                  </div>
                </div>
                {/* Payment */}
                <div style={{background:'white',borderRadius:20,padding:28,border:'1px solid var(--border)'}}>
                  <h3 style={{marginBottom:20,display:'flex',alignItems:'center',gap:8}}><span style={{width:32,height:32,background:'var(--grad-hero)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'0.9rem'}}>3</span> Payment Method</h3>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12}}>
                    {[['COD','💵','Cash on Delivery','Pay when delivered'],['UPI','📱','UPI Payment','GPay, PhonePe, Paytm'],['Card','💳','Debit/Credit Card','All major cards accepted']].map(([val,icon,label,desc]) => (
                      <div key={val} onClick={()=>setPayMethod(val)} style={{padding:'16px 20px',border:`2px solid ${payMethod===val?'var(--red)':'var(--border)'}`,borderRadius:14,cursor:'pointer',background:payMethod===val?'#fff0f0':'white',transition:'all 0.2s'}}>
                        <div style={{fontSize:'1.6rem',marginBottom:6}}>{icon}</div>
                        <div style={{fontWeight:700,fontSize:'0.9rem',color:'var(--text-dark)'}}>{label}</div>
                        <div style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>{desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div style={{background:'white',borderRadius:20,padding:28,border:'1px solid var(--border)',boxShadow:'var(--shadow-lg)',position:'sticky',top:90}}>
                <h3 style={{marginBottom:20,fontSize:'1.1rem'}}>Order Summary</h3>
                {items.map(item => (
                  <div key={item.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,gap:10}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <img src={item.image} alt={item.name} style={{width:44,height:44,objectFit:'contain',borderRadius:8,border:'1px solid var(--border)'}} onError={e=>e.target.src='/images/mango_pickle.png'} />
                      <div><div style={{fontSize:'0.88rem',fontWeight:600}}>{item.name}</div><div style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>Qty: {item.qty||1}</div></div>
                    </div>
                    <span style={{fontWeight:700,color:'var(--text-dark)',flexShrink:0}}>₹{item.price*(parseInt(item.qty)||1)}</span>
                  </div>
                ))}
                <div style={{height:1,background:'var(--border)',margin:'16px 0'}}></div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:'0.9rem'}}><span>Subtotal</span><span>₹{subtotal}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:'0.9rem'}}><span>Delivery</span><span style={{color:shipping===0?'var(--green)':'inherit'}}>{shipping===0?'Free':`₹${shipping}`}</span></div>
                <div style={{height:1,background:'var(--border)',margin:'16px 0'}}></div>
                <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:'1.1rem',marginBottom:24}}><span>Total</span><span style={{color:'var(--red)'}}>₹{total}</span></div>
                <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%',justifyContent:'center',fontSize:'1rem'}} disabled={loading}>
                  {loading ? '⏳ Placing Order...' : `🎉 Place Order · ₹${total}`}
                </button>
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginTop:14,fontSize:'0.8rem',color:'var(--text-muted)'}}>
                  🔒 SSL Secured · Safe Checkout
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

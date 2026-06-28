'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const POLL_INTERVAL = 10000; // 10 seconds – replaces Socket.IO on Vercel

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [filter, setFilter] = useState('All');
  const [notification, setNotification] = useState(null);
  const prevOrderCount = useRef(0);
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async (showLoader = false) => {
    if (!token) { router.push('/admin'); return; }
    if (showLoader) setLoading(true);
    try {
      const [statsRes, ordersRes, prodsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: authHeaders }),
        fetch('/api/admin/orders', { headers: authHeaders }),
        fetch('/api/products'),
      ]);
      if (statsRes.status === 401) { router.push('/admin'); return; }
      const [s, o, p] = await Promise.all([statsRes.json(), ordersRes.json(), prodsRes.json()]);
      setStats(s);
      setOrders(o);
      setProducts(p);
      // Polling notification: detect new orders
      if (prevOrderCount.current > 0 && o.length > prevOrderCount.current) {
        const newest = o[0];
        setNotification({ message: `🛒 New Order: ${newest.order_number} from ${newest.customer_name} · ₹${newest.total}`, type: 'success' });
        try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA...').play(); } catch {}
      }
      prevOrderCount.current = o.length;
    } catch { }
    setLoading(false);
  };

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, status) => {
    await fetch(`/api/admin/orders/${orderId}/status`, { method: 'PUT', headers: authHeaders, body: JSON.stringify({ status }) });
    fetchData(false);
  };

  const logout = () => { localStorage.removeItem('admin_token'); router.push('/admin'); };

  const statusColors = { Pending:'#F39C12', Processing:'#3498DB', Shipped:'#9B59B6', Delivered:'#27AE60', Cancelled:'#E74C3C' };
  const filteredOrders = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0f172a',flexDirection:'column',gap:16}}>
      <div style={{width:60,height:60,border:'4px solid rgba(255,255,255,0.1)',borderTopColor:'#F39C12',borderRadius:'50%',animation:'spin 1s linear infinite'}}></div>
      <p style={{color:'rgba(255,255,255,0.7)',fontWeight:600}}>Loading Dashboard...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'#0f172a',color:'white',fontFamily:'var(--font-ui)'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .stat-card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;transition:all 0.3s} .stat-card:hover{background:rgba(255,255,255,0.08);transform:translateY(-2px)} .order-row{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px 20px;margin-bottom:10px;display:flex;align-items:center;gap:16px;flex-wrap:wrap} .tab-btn{padding:10px 20px;background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.6);font-weight:600;border-bottom:2px solid transparent;transition:all 0.2s;font-size:0.9rem} .tab-btn.active{color:white;border-bottom-color:#F39C12} .filter-btn{padding:6px 16px;border-radius:20px;border:1px solid rgba(255,255,255,0.2);background:none;color:rgba(255,255,255,0.7);cursor:pointer;font-size:0.82rem;transition:all 0.2s} .filter-btn.active{background:#F39C12;border-color:#F39C12;color:#1a1a1a;font-weight:700} .product-row{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:14px 20px;margin-bottom:8px;display:flex;align-items:center;gap:16px}`}</style>

      {notification && (
        <div style={{position:'fixed',top:20,right:20,background:'#27AE60',color:'white',padding:'16px 24px',borderRadius:12,boxShadow:'0 8px 24px rgba(0,0,0,0.3)',zIndex:9999,maxWidth:380,display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
          <span>{notification.message}</span>
          <button onClick={()=>setNotification(null)} style={{background:'none',border:'none',color:'white',cursor:'pointer',fontSize:'1.2rem'}}>✕</button>
        </div>
      )}

      {/* Sidebar */}
      <div style={{display:'flex',minHeight:'100vh'}}>
        <aside style={{width:240,background:'rgba(0,0,0,0.3)',borderRight:'1px solid rgba(255,255,255,0.08)',padding:'24px 16px',flexShrink:0,position:'sticky',top:0,height:'100vh',overflowY:'auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:32,paddingBottom:20,borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
            <img src="/images/logo.png" alt="" width="44" height="44" style={{borderRadius:'50%'}} onError={e=>e.target.style.display='none'} />
            <div><div style={{fontWeight:700,fontSize:'0.95rem'}}>Gowri Pickles</div><div style={{fontSize:'0.75rem',color:'rgba(255,255,255,0.5)'}}>Admin Dashboard</div></div>
          </div>
          <nav>
            {[['orders','📦','Orders',orders.length],['products','🥫','Products',products.length],['stats','📊','Analytics','']].map(([tab,icon,label,count]) => (
              <button key={tab} onClick={()=>setActiveTab(tab)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderRadius:10,marginBottom:4,background:activeTab===tab?'rgba(243,156,18,0.15)':'none',border:activeTab===tab?'1px solid rgba(243,156,18,0.3)':'1px solid transparent',color:activeTab===tab?'#F39C12':'rgba(255,255,255,0.7)',cursor:'pointer',transition:'all 0.2s',textAlign:'left',fontWeight:600,fontSize:'0.9rem'}}>
                <span>{icon} {label}</span>
                {count !== '' && <span style={{background:'rgba(255,255,255,0.1)',padding:'2px 8px',borderRadius:20,fontSize:'0.75rem'}}>{count}</span>}
              </button>
            ))}
          </nav>
          <div style={{marginTop:'auto',paddingTop:20,borderTop:'1px solid rgba(255,255,255,0.1)',marginTop:32}}>
            <div style={{fontSize:'0.75rem',color:'rgba(255,255,255,0.4)',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:'#27AE60',display:'inline-block',animation:'pulse 2s infinite'}}></span>
              Live Polling (10s)
            </div>
            <button onClick={logout} style={{width:'100%',padding:'10px 16px',background:'rgba(231,76,60,0.15)',border:'1px solid rgba(231,76,60,0.3)',color:'#E74C3C',borderRadius:10,cursor:'pointer',fontWeight:600,fontSize:'0.88rem'}}>🚪 Sign Out</button>
          </div>
        </aside>

        {/* Main */}
        <main style={{flex:1,padding:32,overflowY:'auto'}}>
          {/* Stats cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16,marginBottom:32}}>
            {[['📦','Total Orders',stats.totalOrders,'All time'],['⏳','Pending',stats.pendingOrders,'Needs attention'],['💰','Revenue',`₹${(stats.totalRevenue||0).toLocaleString('en-IN')}`,'Total earnings'],['🥫','Products',stats.totalProducts,'In catalog']].map(([icon,label,val,sub]) => (
              <div key={label} className="stat-card">
                <div style={{fontSize:'2rem',marginBottom:8}}>{icon}</div>
                <div style={{fontSize:'1.6rem',fontWeight:800,color:'#F39C12',fontFamily:'var(--font-heading)'}}>{val}</div>
                <div style={{fontWeight:700,marginBottom:2}}>{label}</div>
                <div style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.5)'}}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{display:'flex',gap:0,borderBottom:'1px solid rgba(255,255,255,0.1)',marginBottom:24}}>
            {[['orders','📦 Orders'],['products','🥫 Products'],['stats','📊 Analytics']].map(([tab,label]) => (
              <button key={tab} className={`tab-btn ${activeTab===tab?'active':''}`} onClick={()=>setActiveTab(tab)}>{label}</button>
            ))}
          </div>

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
                {['All','Pending','Processing','Shipped','Delivered','Cancelled'].map(s => (
                  <button key={s} className={`filter-btn ${filter===s?'active':''}`} onClick={()=>setFilter(s)}>{s}</button>
                ))}
              </div>
              {filteredOrders.length === 0 ? (
                <div style={{textAlign:'center',padding:'60px 20px',color:'rgba(255,255,255,0.4)'}}>
                  <div style={{fontSize:'4rem',marginBottom:16}}>📭</div>
                  <p>No orders found.</p>
                </div>
              ) : filteredOrders.map(order => {
                const itemList = (() => { try { return JSON.parse(order.items); } catch { return []; } })();
                return (
                  <div key={order.id} className="order-row">
                    <div style={{minWidth:140}}>
                      <div style={{fontWeight:700,color:'#F39C12',fontFamily:'monospace',fontSize:'0.9rem'}}>{order.order_number}</div>
                      <div style={{fontSize:'0.75rem',color:'rgba(255,255,255,0.5)'}}>{new Date(order.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600}}>{order.customer_name}</div>
                      <div style={{fontSize:'0.8rem',color:'rgba(255,255,255,0.6)'}}>{order.customer_phone} · {order.city}, {order.state}</div>
                      <div style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.5)',marginTop:4}}>{itemList.length} item{itemList.length!==1?'s':''} · {order.payment_method}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontWeight:700,fontSize:'1.1rem',color:'white'}}>₹{order.total}</div>
                    </div>
                    <div>
                      <span style={{padding:'4px 12px',borderRadius:20,background:`${statusColors[order.status]}22`,color:statusColors[order.status]||'white',fontWeight:700,fontSize:'0.78rem',border:`1px solid ${statusColors[order.status]||'white'}44`}}>{order.status}</span>
                    </div>
                    <select defaultValue={order.status} onChange={e=>updateStatus(order.id,e.target.value)} style={{padding:'8px 12px',borderRadius:8,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.15)',color:'white',fontSize:'0.82rem',cursor:'pointer'}}>
                      {['Pending','Processing','Shipped','Delivered','Cancelled'].map(s => <option key={s} value={s} style={{background:'#1e293b'}}>{s}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                <h3 style={{fontSize:'1.1rem',fontWeight:700}}>All Products ({products.length})</h3>
                <a href="/" style={{color:'#F39C12',textDecoration:'none',fontSize:'0.88rem'}}>← View Store</a>
              </div>
              {products.map(p => (
                <div key={p.id} className="product-row">
                  <img src={p.image} alt={p.name} style={{width:52,height:52,objectFit:'contain',borderRadius:8,background:'white',padding:4}} onError={e=>e.target.src='/images/mango_pickle.png'} />
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700}}>{p.name}</div>
                    <div style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.5)'}}>{p.category} · {p.weight} · {p.spice_level}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontWeight:700,color:'#F39C12'}}>₹{p.price}</div>
                    {p.original_price > p.price && <div style={{fontSize:'0.75rem',color:'rgba(255,255,255,0.4)',textDecoration:'line-through'}}>₹{p.original_price}</div>}
                  </div>
                  <div><span style={{padding:'4px 10px',borderRadius:20,background:p.in_stock?'rgba(39,174,96,0.2)':'rgba(231,76,60,0.2)',color:p.in_stock?'#27AE60':'#E74C3C',fontSize:'0.78rem',fontWeight:700}}>{p.in_stock?'In Stock':'Out'}</span></div>
                  <div style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.5)'}}>⭐ {p.rating} ({p.reviews_count})</div>
                </div>
              ))}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div>
              <h3 style={{fontSize:'1.1rem',fontWeight:700,marginBottom:20}}>Recent Orders</h3>
              <div>
                {(stats.recentOrders||[]).map(order => (
                  <div key={order.id} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'14px 20px',marginBottom:10,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
                    <div>
                      <div style={{fontWeight:700,color:'#F39C12',fontSize:'0.88rem'}}>{order.order_number}</div>
                      <div style={{fontSize:'0.82rem',color:'rgba(255,255,255,0.6)'}}>{order.customer_name} · {order.city}</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <span style={{fontWeight:700}}>₹{order.total}</span>
                      <span style={{padding:'4px 10px',borderRadius:20,background:`${statusColors[order.status]}22`,color:statusColors[order.status],fontWeight:700,fontSize:'0.78rem'}}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:32,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
                {[['📦','Total Orders',stats.totalOrders||0,'All time orders'],['💰','Total Revenue',`₹${((stats.totalRevenue||0)/1000).toFixed(1)}K`,'Lifetime earnings'],['⏳','Pending',stats.pendingOrders||0,'Needs fulfillment'],['🥫','Products',stats.totalProducts||0,'In inventory']].map(([icon,label,val,sub]) => (
                  <div key={label} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:16,padding:24,textAlign:'center'}}>
                    <div style={{fontSize:'2.5rem',marginBottom:8}}>{icon}</div>
                    <div style={{fontSize:'1.8rem',fontWeight:800,color:'#F39C12'}}>{val}</div>
                    <div style={{fontWeight:600,marginBottom:4}}>{label}</div>
                    <div style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.5)'}}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

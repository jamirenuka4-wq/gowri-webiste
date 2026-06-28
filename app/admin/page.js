'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('admin_token', data.token);
        router.push('/admin/dashboard');
      } else { setError(data.error || 'Invalid credentials'); }
    } catch { setError('Connection error. Please try again.'); }
    setLoading(false);
  };

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#7B1818 0%,#C0392B 40%,#F39C12 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'white',borderRadius:24,padding:'48px 40px',width:'100%',maxWidth:420,boxShadow:'0 40px 80px rgba(0,0,0,0.2)'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <img src="/images/logo.png" alt="Gowri Pickles" width="72" height="72" style={{borderRadius:'50%',boxShadow:'0 8px 24px rgba(0,0,0,0.15)'}} onError={e=>e.target.style.display='none'} />
          <h1 style={{fontFamily:'var(--font-heading)',fontSize:'1.8rem',color:'var(--text-dark)',marginTop:16,marginBottom:4}}>Admin Portal</h1>
          <p style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>Gowri Pickles Dashboard</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:16}}>
            <label style={{display:'block',fontSize:'0.85rem',fontWeight:600,color:'var(--text-dark)',marginBottom:6}}>Username</label>
            <input className="form-input" type="text" placeholder="admin" required value={form.username} onChange={e=>setForm({...form,username:e.target.value})} />
          </div>
          <div style={{marginBottom:24}}>
            <label style={{display:'block',fontSize:'0.85rem',fontWeight:600,color:'var(--text-dark)',marginBottom:6}}>Password</label>
            <input className="form-input" type="password" placeholder="••••••••" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
          </div>
          {error && <div style={{background:'#fff0f0',border:'1px solid #ffcccc',borderRadius:10,padding:'12px 16px',marginBottom:16,color:'var(--red)',fontSize:'0.88rem'}}>⚠️ {error}</div>}
          <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%',justifyContent:'center',fontSize:'1rem'}} disabled={loading}>
            {loading ? '⏳ Signing in...' : '🔑 Sign In to Dashboard'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:20,fontSize:'0.8rem',color:'var(--text-muted)'}}>Default: admin / admin123</p>
        <a href="/" style={{display:'block',textAlign:'center',marginTop:12,color:'var(--text-muted)',textDecoration:'none',fontSize:'0.85rem'}}>← Back to Store</a>
      </div>
    </div>
  );
}

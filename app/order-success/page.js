'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const params = useSearchParams();
  const orderNum = params.get('order') || 'GP' + Date.now().toString().slice(-8);
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    setConfetti(Array.from({length:30}, (_,i) => ({
      id: i,
      left: Math.random()*100,
      color: ['#F39C12','#C0392B','#27AE60','#3498DB','#E91E63'][Math.floor(Math.random()*5)],
      delay: Math.random()*2,
      size: 6+Math.random()*10,
    })));
  }, []);

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,var(--cream) 0%,white 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:20,position:'relative',overflow:'hidden'}}>
      {confetti.map(c => (
        <div key={c.id} style={{position:'absolute',left:`${c.left}%`,top:-20,width:c.size,height:c.size,background:c.color,borderRadius:'50%',animation:`confetti-fall 3s ease ${c.delay}s infinite`}} />
      ))}
      <style>{`@keyframes confetti-fall { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }`}</style>
      <div style={{background:'white',borderRadius:28,padding:'56px 48px',maxWidth:560,width:'100%',textAlign:'center',boxShadow:'0 40px 80px rgba(0,0,0,0.1)',border:'1px solid var(--border)',position:'relative',zIndex:1}}>
        <div style={{width:100,height:100,background:'linear-gradient(135deg,var(--green),#1DB954)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',fontSize:'3rem',boxShadow:'0 16px 40px rgba(39,174,96,0.35)'}}>🎉</div>
        <h1 style={{fontFamily:'var(--font-heading)',fontSize:'2.2rem',color:'var(--text-dark)',marginBottom:8}}>Order Placed!</h1>
        <p style={{color:'var(--text-muted)',fontSize:'1.05rem',marginBottom:24}}>Thank you! Your delicious pickles are on the way.</p>
        <div style={{background:'var(--cream)',borderRadius:16,padding:'20px 28px',marginBottom:28,border:'1px solid var(--border)'}}>
          <div style={{fontSize:'0.82rem',color:'var(--text-muted)',marginBottom:6}}>Order Number</div>
          <div style={{fontFamily:'var(--font-heading)',fontSize:'1.8rem',fontWeight:900,color:'var(--red)',letterSpacing:2}}>{orderNum}</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:28,textAlign:'left'}}>
          {[['📦','Confirmed','Your order is confirmed'],['🚚','Dispatch','Ships in 24 hours'],['📬','Delivery','Arrives in 3–5 days'],['🌶️','Enjoy!','Fresh pickles await']].map(([icon,label,desc]) => (
            <div key={label} style={{background:'var(--cream)',borderRadius:12,padding:'14px 16px',border:'1px solid var(--border)'}}>
              <div style={{fontSize:'1.4rem',marginBottom:4}}>{icon}</div>
              <div style={{fontWeight:700,fontSize:'0.88rem',color:'var(--text-dark)'}}>{label}</div>
              <div style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>{desc}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center'}}>
          <a href={`https://wa.me/919876543210?text=Hi! I placed Order ${orderNum}. Can I track it?`} target="_blank" rel="noopener noreferrer" className="btn btn-lg" style={{background:'#25D366',color:'white',flex:1,minWidth:160,justifyContent:'center'}}>💬 Track on WhatsApp</a>
          <a href="/" className="btn btn-secondary btn-lg" style={{flex:1,minWidth:160,justifyContent:'center'}}>🏠 Back to Home</a>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}

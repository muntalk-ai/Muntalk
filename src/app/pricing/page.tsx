'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PLANS, PlanId, getSubscription } from '@/lib/subscription';

function PricingContent() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [selected,    setSelected]    = useState<PlanId>((searchParams.get('plan') as PlanId) || 'biannual');
  const [loading,     setLoading]     = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanId>('free');
  const [openFaq,     setOpenFaq]     = useState<number | null>(null);

  useEffect(() => {
    if (user) getSubscription(user.uid).then(s => setCurrentPlan(s.planId));
  }, [user]);

  const handleCheckout = async (planId: PlanId) => {
    if (planId === 'free') return;
    if (!user) { router.push('/login?redirect=/pricing'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, uid: user.uid, email: user.email }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const faqs = [
    { q: 'How much is free?', a: 'A1 level (12 lessons) + 3 AI tutor chats per day are free forever. Hearts refill 1 every 4 hours.' },
    { q: 'Can I cancel anytime?', a: 'Yes — cancel from Profile → Subscription at any time. You keep Premium access until your billing period ends.' },
    { q: 'What payment methods are accepted?', a: 'All major credit and debit cards via Stripe. Safe, encrypted, PCI-compliant.' },
    { q: 'Can I switch plans?', a: 'Yes! Upgrade or downgrade anytime. The price difference is prorated automatically.' },
  ];

  const planOrder: PlanId[] = ['free', 'monthly', 'biannual', 'annual'];

  return (
    <div style={{ minHeight:'100vh', background:'#fff', fontFamily:"'Nunito',sans-serif", position:'relative' }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .cta-btn:hover { filter:brightness(1.06); transform:translateY(-1px); }
        .cta-btn:active { transform:scale(.98); }
        .cta-btn { transition:all .15s ease; }
        .plan-card { transition:transform .2s, box-shadow .2s; }
        .plan-card:hover { transform:translateY(-3px); }
      ` }} />

      {/* Subtle background tint */}
      <div style={{ position:'fixed', top:-300, right:-200, width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 65%)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:-200, left:-150, width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,0.05) 0%,transparent 65%)', pointerEvents:'none', zIndex:0 }} />

      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:100, display:'flex', alignItems:'center', padding:'0 28px', height:56, background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)', borderBottom:'1px solid #F1F5F9' }}>
        <button onClick={() => router.push('/lingua')} style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', fontSize:13, fontWeight:700, fontFamily:"'Nunito',sans-serif" }}>
          ← Back
        </button>
        <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', fontSize:16, fontWeight:900, color:'#0F172A' }}>
          🗣️ MunTalk
        </div>
        {user && (
          <div style={{ marginLeft:'auto' }}>
            {user.photoURL
              ? <img src={user.photoURL} style={{ width:28,height:28,borderRadius:'50%',objectFit:'cover' }} alt="" />
              : <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#6366F1,#8B5CF6)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:12 }}>{(user.displayName||'U')[0]}</div>
            }
          </div>
        )}
      </nav>

      <div style={{ maxWidth:1040, margin:'0 auto', padding:'60px 20px 100px', position:'relative', zIndex:1 }}>

        {/* Hero */}
        <div style={{ textAlign:'center', marginBottom:64, animation:'fadeUp .5s ease' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#EEF2FF', border:'1px solid #C7D2FE', color:'#6366F1', fontSize:11, fontWeight:800, borderRadius:20, padding:'5px 14px', marginBottom:22, letterSpacing:0.6, textTransform:'uppercase' }}>
            ✦ 50% off on the Annual plan
          </div>
          <h1 style={{ fontSize:'clamp(36px,6vw,64px)', fontWeight:900, color:'#0F172A', lineHeight:1.05, marginBottom:16, letterSpacing:-1.5 }}>
            The smartest way<br />
            <span style={{ background:'linear-gradient(95deg,#6366F1,#8B5CF6,#C084FC)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              to learn a language
            </span>
          </h1>
          <p style={{ fontSize:15, color:'#64748B', maxWidth:460, margin:'0 auto 30px', lineHeight:1.75, fontWeight:700 }}>
            72 lessons · 65 languages · AI tutor · No ads · Cancel anytime
          </p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, flexWrap:'wrap' }}>
            <div style={{ display:'flex' }}>
              {['👨‍💻','👩‍🎓','👨‍🏫','👩‍💼','🧑‍🎨'].map((e,i) => (
                <div key={i} style={{ width:30,height:30,borderRadius:'50%',background:'#EEF2FF',border:'2px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,marginLeft:i>0?-8:0,position:'relative',zIndex:5-i }}>{e}</div>
              ))}
            </div>
            <span style={{ fontSize:13,color:'#64748B',fontWeight:700 }}><span style={{ color:'#0F172A',fontWeight:900 }}>2,400+</span> learners enrolled</span>
            <span style={{ color:'#F59E0B',fontSize:13,letterSpacing:2 }}>★★★★★</span>
          </div>
        </div>

        {/* Plan Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(225px,1fr))', gap:14, marginBottom:80, alignItems:'end' }}>
          {planOrder.map((planId, i) => {
            const plan       = PLANS[planId];
            const isFeatured = planId === 'biannual';
            const isAnnual   = planId === 'annual';
            const isFree     = planId === 'free';
            const isCurrent  = currentPlan === planId;
            const isSelected = selected === planId;

            return (
              <div key={planId} className="plan-card"
                onClick={() => !isFree && setSelected(planId)}
                style={{
                  borderRadius:22,
                  padding: isFeatured ? '36px 26px 28px' : '28px 22px 24px',
                  background: isFeatured
                    ? 'linear-gradient(155deg,#312E81,#4C1D95)'
                    : isAnnual ? 'linear-gradient(155deg,#1C1917,#292524)'
                    : '#fff',
                  border: isFeatured ? '1.5px solid rgba(129,140,248,0.5)'
                    : isAnnual ? '1.5px solid rgba(252,211,77,0.2)'
                    : isSelected ? `1.5px solid ${plan.color}` : '1.5px solid #F1F5F9',
                  boxShadow: isFeatured ? '0 20px 52px rgba(79,70,229,0.2)'
                    : isSelected ? `0 8px 28px ${plan.color}18` : '0 2px 8px rgba(0,0,0,0.04)',
                  cursor: isFree ? 'default' : 'pointer',
                  position:'relative',
                  animation:`fadeUp .45s ease ${i*0.08}s both`,
                  display:'flex', flexDirection:'column',
                }}>

                {plan.badge && (
                  <div style={{ position:'absolute', top:-13, left:'50%', transform:'translateX(-50%)', whiteSpace:'nowrap', background: isFeatured ? 'linear-gradient(90deg,#818CF8,#C084FC)' : 'linear-gradient(90deg,#F59E0B,#F97316)', color:'#fff', fontSize:11, fontWeight:900, padding:'4px 16px', borderRadius:20, letterSpacing:0.4 }}>
                    {plan.badge}
                  </div>
                )}
                {isCurrent && (
                  <div style={{ position:'absolute', top:-13, right:16, background:'#10B981', color:'#fff', fontSize:10, fontWeight:900, padding:'4px 12px', borderRadius:20 }}>
                    Current plan
                  </div>
                )}

                <div style={{ fontSize:10, fontWeight:900, letterSpacing:2.5, textTransform:'uppercase', color: (isFeatured||isAnnual) ? 'rgba(255,255,255,0.4)' : '#94A3B8', marginBottom:14 }}>
                  {plan.name}
                </div>

                {isFree ? (
                  <div style={{ fontSize:44, fontWeight:900, color:'#CBD5E1', lineHeight:1, marginBottom:6 }}>Free</div>
                ) : (
                  <div style={{ marginBottom:4 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:1, lineHeight:1 }}>
                      <span style={{ fontSize:18, fontWeight:800, color:(isFeatured||isAnnual)?'rgba(255,255,255,0.45)':'#94A3B8', paddingTop:8 }}>$</span>
                      <span style={{ fontSize:52, fontWeight:900, letterSpacing:-3, color:(isFeatured||isAnnual)?'#fff':'#0F172A' }}>
                        {Math.floor(plan.monthlyPrice)}
                      </span>
                      <span style={{ fontSize:16, fontWeight:800, color:(isFeatured||isAnnual)?'rgba(255,255,255,0.45)':'#94A3B8', paddingTop:12 }}>
                        .{String(Math.round((plan.monthlyPrice % 1) * 100)).padStart(2,'0')}
                      </span>
                    </div>
                    <div style={{ fontSize:11, color:(isFeatured||isAnnual)?'rgba(255,255,255,0.3)':'#94A3B8', fontWeight:800 }}>/mo equivalent</div>
                  </div>
                )}

                {plan.price > 0 && (
                  <div style={{ fontSize:11, color:(isFeatured||isAnnual)?'rgba(255,255,255,0.3)':'#94A3B8', fontWeight:700, marginBottom:18 }}>
                    Billed ${plan.price} / {plan.period}
                    {plan.discount > 0 && (
                      <span style={{ marginLeft:6, color: isFeatured ? '#A5B4FC' : '#FCD34D', fontWeight:900 }}>
                        — {plan.discount}% off
                      </span>
                    )}
                  </div>
                )}
                {isFree && <div style={{ marginBottom:18 }} />}

                <div style={{ height:1, background:(isFeatured||isAnnual)?'rgba(255,255,255,0.08)':'#F1F5F9', marginBottom:18 }} />

                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:9, marginBottom:22 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display:'flex', gap:9, alignItems:'flex-start' }}>
                      <span style={{ color: isFeatured ? '#818CF8' : isAnnual ? '#FCD34D' : plan.color, fontSize:12, flexShrink:0, marginTop:2 }}>✓</span>
                      <span style={{ fontSize:12, color:(isFeatured||isAnnual)?'rgba(255,255,255,0.6)':'#374151', lineHeight:1.45, fontWeight:700 }}>{f}</span>
                    </div>
                  ))}
                  {/* Word Bank mention for paid plans */}
                  {!isFree && (
                    <div style={{ display:'flex', gap:9, alignItems:'flex-start' }}>
                      <span style={{ color: isFeatured ? '#818CF8' : isAnnual ? '#FCD34D' : plan.color, fontSize:12, flexShrink:0, marginTop:2 }}>✓</span>
                      <span style={{ fontSize:12, color:(isFeatured||isAnnual)?'rgba(255,255,255,0.6)':'#374151', lineHeight:1.45, fontWeight:700 }}>
                        18,000+ words — verbs, adjectives, adverbs & phrases
                      </span>
                    </div>
                  )}
                </div>

                {isFree ? (
                  <div style={{ textAlign:'center', fontSize:12, color:'#94A3B8', fontWeight:800, padding:'11px 0' }}>
                    {currentPlan === 'free' ? 'Your current plan' : 'Downgrade'}
                  </div>
                ) : (
                  <button className="cta-btn"
                    onClick={e => { e.stopPropagation(); handleCheckout(planId); }}
                    disabled={loading || isCurrent}
                    style={{
                      width:'100%', padding:'13px', borderRadius:13, border:'none', fontSize:13, fontWeight:900, letterSpacing:0.4,
                      cursor: isCurrent ? 'default' : 'pointer',
                      background: isFeatured ? 'linear-gradient(135deg,#818CF8,#C084FC)'
                        : isAnnual ? 'linear-gradient(135deg,#FCD34D,#F59E0B)'
                        : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                      color: isAnnual ? '#1C1917' : '#fff',
                      opacity: isCurrent ? 0.45 : 1,
                    }}>
                    {loading && selected === planId ? 'Processing...' :
                     isCurrent ? 'Current Plan' :
                     planId === 'monthly' ? 'Start Monthly' :
                     planId === 'biannual' ? '🚀 Get 6 Months' : '🏆 Get Annual'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Word Bank highlight banner */}
        <div style={{ background:'linear-gradient(135deg,#EEF2FF,#F5F3FF)', border:'1.5px solid #C7D2FE', borderRadius:20, padding:'28px 32px', marginBottom:56, display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
          <div style={{ fontSize:40, flexShrink:0 }}>📚</div>
          <div style={{ flex:1, minWidth:220 }}>
            <div style={{ fontSize:16, fontWeight:900, color:'#3730A3', marginBottom:6 }}>18,000+ Word Bank — Premium Exclusive</div>
            <div style={{ fontSize:13, color:'#4338CA', lineHeight:1.6, fontWeight:700 }}>
              Master essential <strong>verbs, adjectives, adverbs, and phrases</strong> with AI-powered sentence practice. Organized into 50-word sets with 5 example sentences each — the fastest way to build real vocabulary.
            </div>
          </div>
          <button className="cta-btn" onClick={() => handleCheckout('biannual')}
            style={{ padding:'11px 22px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', fontSize:13, fontWeight:900, cursor:'pointer', whiteSpace:'nowrap' }}>
            Unlock Word Bank →
          </button>
        </div>

        {/* Features grid */}
        <div style={{ marginBottom:64 }}>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#0F172A', textAlign:'center', marginBottom:8, letterSpacing:-0.4 }}>Everything in Premium</h2>
          <p style={{ textAlign:'center', color:'#94A3B8', fontSize:13, fontWeight:700, marginBottom:32 }}>One plan. All features.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(195px,1fr))', gap:10 }}>
            {[
              { icon:'📚', title:'72 Lessons', desc:'Full A1 → C2 curriculum' },
              { icon:'🤖', title:'Unlimited AI Tutor', desc:'Chat 24/7 in your target language' },
              { icon:'🔁', title:'Spaced Repetition', desc:'SM-2 algorithm for perfect recall' },
              { icon:'🏆', title:'League System', desc:'Compete with learners worldwide' },
              { icon:'❤️', title:'Unlimited Hearts', desc:'No waiting, keep going' },
              { icon:'📖', title:'18,000+ Word Bank', desc:'Verbs, adjectives, adverbs, phrases' },
              { icon:'📊', title:'Progress Dashboard', desc:'Track streaks, XP & mastery' },
              { icon:'📧', title:'Smart Reminders', desc:'Email + Telegram + push notifications' },
            ].map(f => (
              <div key={f.title} style={{ padding:'18px', borderRadius:14, background:'#F8FAFC', border:'1px solid #F1F5F9', display:'flex', alignItems:'flex-start', gap:12 }}>
                <div style={{ fontSize:22, flexShrink:0 }}>{f.icon}</div>
                <div>
                  <div style={{ fontSize:12, fontWeight:900, color:'#0F172A', marginBottom:3 }}>{f.title}</div>
                  <div style={{ fontSize:11, color:'#94A3B8', lineHeight:1.5, fontWeight:700 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth:620, margin:'0 auto 72px' }}>
          <h2 style={{ fontSize:20, fontWeight:900, color:'#0F172A', textAlign:'center', marginBottom:24, letterSpacing:-0.3 }}>Frequently asked questions</h2>
          {faqs.map((item, i) => (
            <div key={i} style={{ borderRadius:13, border:`1px solid ${openFaq===i?'#C7D2FE':'#F1F5F9'}`, marginBottom:8, overflow:'hidden', background: openFaq===i ? '#F5F3FF' : '#fff', transition:'background .15s' }}>
              <button onClick={() => setOpenFaq(openFaq===i ? null : i)}
                style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', background:'none', border:'none', cursor:'pointer', padding:'16px 20px', textAlign:'left', fontFamily:"'Nunito',sans-serif" }}>
                <span style={{ fontSize:13, fontWeight:800, color:'#0F172A' }}>{item.q}</span>
                <span style={{ fontSize:18, color:'#94A3B8', transition:'transform .2s', transform: openFaq===i?'rotate(45deg)':'none', flexShrink:0, marginLeft:12 }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ padding:'0 20px 16px', fontSize:13, color:'#64748B', lineHeight:1.7, fontWeight:700 }}>{item.a}</div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign:'center', padding:'52px 32px', background:'linear-gradient(135deg,#EEF2FF,#F5F3FF)', borderRadius:28, border:'1.5px solid #C7D2FE' }}>
          <div style={{ fontSize:40, marginBottom:14, animation:'float 3s ease-in-out infinite', display:'inline-block' }}>🚀</div>
          <h2 style={{ fontSize:24, fontWeight:900, color:'#0F172A', marginBottom:10, letterSpacing:-0.5 }}>Ready to become fluent?</h2>
          <p style={{ fontSize:14, color:'#64748B', marginBottom:28, fontWeight:700 }}>Join thousands of learners. Start free, upgrade when ready.</p>
          <button className="cta-btn" onClick={() => handleCheckout('biannual')}
            style={{ padding:'15px 40px', borderRadius:16, border:'none', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', fontSize:15, fontWeight:900, cursor:'pointer', letterSpacing:0.3 }}>
            Start 6-Month Plan →
          </button>
          <div style={{ fontSize:11, color:'#94A3B8', marginTop:12, fontWeight:800 }}>No credit card needed for the free tier</div>
        </div>

      </div>
    </div>
  );
}

export default function PricingPage() {
  return <Suspense><PricingContent /></Suspense>;
}

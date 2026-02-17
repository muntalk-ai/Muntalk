"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6, ease: "easeOut" }
};

export default function MuntalkHome() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", text: "Bonjour! I'm your AI Tutor. Ready to practice a language today?" }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setIsSubmitted(true);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMsg = { role: "user", text: userInput };
    setMessages(prev => [...prev, userMsg]);
    setUserInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text }),
      });
      
      const data = await response.json();
      const aiMsg = { role: "ai", text: data.text || "AI response error." };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", text: "Check if /api/chat/route.ts exists!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#0b101a] min-h-screen text-white font-sans selection:bg-[#e5ff4d] overflow-x-hidden relative">
      
      {/* 배경 효과 - z-0 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-[#e5ff4d]/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[40%] h-[40%] bg-[#f0c3ff]/5 blur-[100px] rounded-full" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bowlby+One+SC&family=Inter:wght@400;600&display=swap');
        .bowl-font { font-family: 'Bowlby One SC', cursive !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
      
      {/* 헤더 */}
      <div className="fixed top-0 left-0 w-full z-[100] pointer-events-none">
        <header className="max-w-[1200px] mx-auto px-6 py-4 flex justify-between items-center pointer-events-auto">
          <div className="flex gap-2">
            {['Features', 'Pricing'].map((item) => (
              <button key={item} onClick={() => scrollToSection(`${item.toLowerCase()}-section`)} className="text-white text-[10px] font-bold px-3 py-1 border border-white/10 rounded-full tracking-widest hover:bg-white/20 transition-all cursor-pointer">
                {item}
              </button>
            ))}
          </div>
          <div onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="bg-white px-4 py-1 flex items-center gap-2 rounded-b-lg cursor-pointer shadow-xl">
             <span className="bowl-font text-black text-[11px]">MUN</span><span className="bowl-font text-[#FFD700] text-[11px]">TALK</span>
          </div>
          <button onClick={() => scrollToSection('contact-section')} className="bg-[#f0c3ff] text-black font-black px-4 py-1.5 rounded-sm text-[10px] uppercase tracking-widest cursor-pointer">Join</button>
        </header>
      </div>

      <main className="relative z-10 max-w-6xl mx-auto pt-40 px-6 text-center">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bowl-font text-[45px] md:text-[90px] leading-[0.9] text-[#e5ff4d] uppercase italic mb-16 tracking-tighter">
          LEARN A LANGUAGE <br /> WITH AI
        </motion.h1>

        {/* 메인 섹션 */}
        <div className="flex flex-col lg:flex-row gap-10 items-stretch mb-24 min-h-[500px] relative z-20">
          <motion.div {...fadeInUp} className="flex-1 border border-white/10 rounded-[40px] overflow-hidden bg-[#111111]/80 shadow-2xl">
            <img src="/your-image.jpg" className="w-full h-full object-cover opacity-80 min-h-[350px]" alt="Hero" />
          </motion.div>

          {/* 채팅창 - z-50 및 pointer-events-auto 강제 설정 */}
          <motion.div {...fadeInUp} className="w-full lg:w-[400px] bg-[#161b22] border border-white/10 rounded-[32px] p-6 flex flex-col shadow-2xl relative z-50 pointer-events-auto">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <div className="w-8 h-8 bg-[#e5ff4d] rounded-full flex items-center justify-center text-black font-bold">M</div>
              <div className="text-left font-bold text-[12px] uppercase tracking-wider">AI Tutor</div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto no-scrollbar pb-4 max-h-[300px]">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[12px] ${msg.role === "ai" ? "bg-[#0b101a] text-gray-200 rounded-tl-none border border-white/5" : "bg-[#e5ff4d] text-black font-semibold rounded-tr-none"}`}>{msg.text}</div>
                </div>
              ))}
              {isLoading && <div className="text-[10px] text-gray-500 animate-pulse">Thinking...</div>}
            </div>

            {/* 입력창 폼 */}
            <form onSubmit={sendMessage} className="mt-4 pt-4 border-t border-white/5 relative z-[60]">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={userInput} 
                  onChange={(e) => setUserInput(e.target.value)} 
                  placeholder="Type a message..." 
                  className="w-full bg-[#0b101a] border border-white/10 rounded-full px-5 py-3 text-[13px] text-white outline-none focus:border-[#e5ff4d] transition-all pr-12"
                  autoComplete="off"
                />
                <button 
                  type="submit" 
                  className="absolute right-2 w-8 h-8 bg-[#e5ff4d] rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* 가입 섹션 */}
        <section id="contact-section" className="py-32 border-t border-white/5 relative z-30">
          <div className="max-w-xs mx-auto">
            <h2 className="bowl-font text-[25px] mb-8 uppercase">Join Muntalk</h2>
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.form key="f" onSubmit={handleSubscribe} className="space-y-3">
                  <input required type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email address" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-center text-[12px] outline-none focus:border-[#e5ff4d]" />
                  <button type="submit" className="w-full bg-[#e5ff4d] text-black font-bold py-3 rounded-lg text-[10px] uppercase cursor-pointer hover:bg-white transition-colors">Subscribe</button>
                </motion.form>
              ) : (
                <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bowl-font text-[#e5ff4d] text-xl">WELCOME!</motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  );
}
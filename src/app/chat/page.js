'use client';
import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef(null);

  // 자동 스크롤 하단 이동
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    await addDoc(collection(db, "messages"), {
      text: newMessage,
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      createdAt: serverTimestamp(),
    });
    setNewMessage("");
  };

  return (
    <div style={{ backgroundColor: '#f0f2f5', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* 상단 헤더 */}
      <header style={{ backgroundColor: '#fff', padding: '15px 20px', borderBottom: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#007aff' }}>
        🇨🇦 Muntalk Community Chat
      </header>

      {/* 채팅창 영역 */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map(msg => {
          const isMe = msg.uid === auth.currentUser?.uid;
          return (
            <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
              {!isMe && <small style={{ marginLeft: '5px', color: '#666', fontSize: '11px' }}>{msg.email?.split('@')[0]}</small>}
              <div style={{ 
                backgroundColor: isMe ? '#007aff' : '#fff', 
                color: isMe ? '#fff' : '#000', 
                padding: '10px 15px', 
                borderRadius: isMe ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                marginTop: '3px'
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* 입력창 영역 */}
      <form onSubmit={sendMessage} style={{ padding: '20px', backgroundColor: '#fff', borderTop: '1px solid #ddd', display: 'flex', gap: '10px' }}>
        <input 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
          placeholder="Message..."
          style={{ flex: 1, padding: '12px 18px', borderRadius: '25px', border: '1px solid #ddd', outline: 'none', backgroundColor: '#f8f9fa' }}
        />
        <button type="submit" style={{ 
          backgroundColor: '#007aff', color: '#white', border: 'none', borderRadius: '50%', width: '45px', height: '45px', 
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#fff'
        }}>
          ▶
        </button>
      </form>
    </div>
  );
}
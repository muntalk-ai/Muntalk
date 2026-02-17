'use client';
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export default function NewsPage() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");

  const fetchPosts = async () => {
    const querySnapshot = await getDocs(collection(db, "news"));
    setPosts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchPosts(); }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Canada Local News</h1>
      {posts.map(post => (
        <div key={post.id} style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
          <h3>{post.title}</h3>
          <small>{post.createdAt?.toDate().toLocaleDateString()}</small>
        </div>
      ))}
    </div>
  );
}
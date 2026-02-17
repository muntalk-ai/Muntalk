'use client';
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase'; 
import { collection, getDocs } from 'firebase/firestore';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const userList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(userList);
      } catch (error) {
        console.error("데이터 로딩 에러:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Loading user data...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: '#333' }}>User Management (PIPEDA Compliance)</h2>
      <p>캐나다 현지 가입자 명단입니다.</p>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ background: '#0070f3', color: 'white', textAlign: 'left' }}>
            <th style={{ padding: '12px', border: '1px solid #ddd' }}>Email</th>
            <th style={{ padding: '12px', border: '1px solid #ddd' }}>Role</th>
            <th style={{ padding: '12px', border: '1px solid #ddd' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>{user.email}</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                <span style={{ backgroundColor: user.role === 'admin' ? '#ffeeba' : '#e1f5fe', padding: '3px 8px', borderRadius: '4px' }}>
                  {user.role}
                </span>
              </td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>Active</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
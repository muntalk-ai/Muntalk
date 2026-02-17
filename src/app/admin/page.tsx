'use client';

import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase'; 
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// 1. 컴포넌트를 먼저 정의합니다.
const AdminPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const userList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    } catch (error) {
      console.error("Data loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change user role to ${newRole}?`)) return;

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: newRole });
      alert("Updated successfully.");
      fetchUsers(); 
    } catch (error) {
      alert("Error: " + error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteDoc(doc(db, "users", userId));
      alert("User deleted.");
      fetchUsers(); 
    } catch (error) {
      alert("Error: " + error);
    }
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading Dashboard...</div>;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h2 style={s.title}>User Management</h2>
        <p style={s.subtitle}>PIPEDA Compliance Dashboard (Canada)</p>
      </div>
      
      <div style={s.tableContainer}>
        <table style={s.table}>
          <thead>
            <tr style={s.thead}>
              <th style={s.th}>Email</th>
              <th style={s.th}>Role</th>
              <th style={s.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={s.tr}>
                <td style={s.td}>{user.email}</td>
                <td style={s.td}>
                  <span style={{ 
                    backgroundColor: user.role === 'admin' ? '#ffeeba' : '#e1f5fe', 
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' 
                  }}>
                    {user.role || 'user'}
                  </span>
                </td>
                <td style={s.td}>
                  <button onClick={() => toggleRole(user.id, user.role)} style={s.roleBtn}>Change Role</button>
                  <button onClick={() => deleteUser(user.id)} style={s.delBtn}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 2. 반드시 마지막에 명시적으로 export default를 작성합니다.
export default AdminPage;

// 3. 스타일 객체에서 타입 선언 방식을 안전하게 변경합니다.
const s: Record<string, React.CSSProperties> = {
  container: { padding: '40px', backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' },
  header: { marginBottom: '30px' },
  title: { fontSize: '28px', color: '#1a1a1a', margin: 0 },
  subtitle: { color: '#666', fontSize: '14px' },
  tableContainer: { backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#0070f3', color: 'white', textAlign: 'left' },
  th: { padding: '15px 20px' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '15px 20px' },
  roleBtn: { marginRight: '10px', padding: '6px 12px', border: '1px solid #0070f3', background: 'none', color: '#0070f3', borderRadius: '6px', cursor: 'pointer' },
  delBtn: { padding: '6px 12px', border: 'none', background: '#ff4b4b', color: 'white', borderRadius: '6px', cursor: 'pointer' }
};
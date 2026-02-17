// src/app/admin/layout.js
export default function AdminLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* 왼쪽 사이드바 */}
      <nav style={{ width: '250px', backgroundColor: '#2c3e50', color: 'white', padding: '20px' }}>
        <h3>Muntalk Admin</h3>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '30px' }}>
          <li style={{ marginBottom: '15px' }}>👤 User List</li>
          <li style={{ marginBottom: '15px', color: '#bdc3c7' }}>💬 Chat History (Coming)</li>
          <li style={{ marginBottom: '15px', color: '#bdc3c7' }}>⚙️ Settings</li>
        </ul>
      </nav>

      {/* 오른쪽 메인 콘텐츠 */}
      <main style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        <header style={{ padding: '20px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <strong>Welcome back, Admin</strong>
        </header>
        <section>{children}</section>
      </main>
    </div>
  );
}
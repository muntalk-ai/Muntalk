'use client';

const ROLES = [
  { id: 'cafe', title: 'Cafe', icon: '☕' },
  { id: 'airport', title: 'Airport', icon: '✈️' },
  { id: 'office', title: 'Office', icon: '💼' },
  { id: 'friend', title: 'Daily Chat', icon: '💬' }
];

export default function RoleSelect({ onNext }: { onNext: (role: string) => void }) {
  return (
    <div style={styles.pageContainer}>
      <h2 style={styles.stepTitle}>Choose a Scenario</h2>
      <div style={styles.grid}>
        {ROLES.map(r => (
          <button key={r.id} onClick={() => onNext(r.id)} style={styles.roleCard}>
            <span style={{ fontSize: '40px' }}>{r.icon}</span>
            <span style={styles.roleTitle}>{r.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: any = {
  pageContainer: { minHeight: '100dvh', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#fff' },
  stepTitle: { fontSize: '24px', fontWeight: 'bold', marginBottom: '40px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%', maxWidth: '400px' },
  roleCard: { padding: '30px', borderRadius: '20px', border: '2px solid #eee', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' },
  roleTitle: { fontWeight: 'bold', color: '#333' }
};
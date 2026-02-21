'use client';

export default function ReportModal({ history, onBack }: any) {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <h2 style={{textAlign: 'center', color: '#333'}}>Learning Report</h2>
        <div style={styles.reportList}>
          {history.length === 0 ? <p style={{textAlign: 'center', color: '#888'}}>No records.</p> : 
            history.map((item: any, i: number) => (
            <div key={i} style={styles.reportCard}>
              <div style={{color: '#ff4b4b', fontSize: '13px'}}>❌ {item.user}</div>
              <div style={{color: '#58CC02', fontWeight: 'bold', margin: '5px 0'}}>✅ {item.better}</div>
              <div style={styles.reasonBox}>💡 {item.reason}</div>
            </div>
          ))}
        </div>
        <button onClick={onBack} style={styles.closeBtn}>Exit Class</button>
      </div>
    </div>
  );
}

const styles: any = {
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: '#fff', width: '90%', maxWidth: '450px', borderRadius: '25px', padding: '25px' },
  reportList: { maxHeight: '55dvh', overflowY: 'auto', margin: '20px 0' },
  reportCard: { backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '18px', marginBottom: '12px', border: '1px solid #edf2f7' },
  reasonBox: { fontSize: '12px', color: '#718096', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '8px' },
  closeBtn: { width: '100%', padding: '16px', backgroundColor: '#58CC02', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold' }
};
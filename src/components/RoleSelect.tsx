'use client';

import React from 'react';

// Define categories by learning objectives
const learningRoles = [
  { 
    id: 'grammar', 
    title: 'Grammar & Correction', 
    icon: '✍️', 
    desc: 'Get instant feedback and natural sentence suggestions.' 
  },
  { 
    id: 'idiom', 
    title: 'Idioms & Slang', 
    icon: '💡', 
    desc: 'Learn real expressions used by native speakers.' 
  },
  { 
    id: 'business', 
    title: 'Business English', 
    icon: '💼', 
    desc: 'Master professional emails, meetings, and interviews.' 
  },
  { 
    id: 'discussion', 
    title: 'Topic Discussion', 
    icon: '📰', 
    desc: 'Enhance your skills by debating news and trending topics.' 
  },
  { 
    id: 'casual', 
    title: 'Casual Free Talk', 
    icon: '💬', 
    desc: 'Chat comfortably with a friend about your daily life.' 
  },
];

interface RoleSelectProps {
  onNext: (roleId: string) => void;
}

export default function RoleSelect({ onNext }: RoleSelectProps) {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>What do you want to focus on?</h2>
      <p style={styles.subtitle}>Select a mode that matches your learning goal.</p>
      
      <div style={styles.grid}>
        {learningRoles.map((role) => (
          <button 
            key={role.id} 
            onClick={() => onNext(role.id)}
            style={styles.card}
          >
            <div style={styles.icon}>{role.icon}</div>
            <div style={styles.textContainer}>
              <div style={styles.roleTitle}>{role.title}</div>
              <div style={styles.roleDesc}>{role.desc}</div>
            </div>
            <div style={styles.arrow}>→</div>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '40px 20px',
    maxWidth: '600px',
    margin: '0 auto',
    textAlign: 'center' as const,
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    marginBottom: '8px',
    color: '#111',
  },
  subtitle: {
    fontSize: '15px',
    color: '#666',
    marginBottom: '30px',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    padding: '18px 20px',
    backgroundColor: '#FFF',
    border: '1px solid #E9ECEF',
    borderRadius: '20px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
    outline: 'none',
  },
  icon: {
    fontSize: '28px',
    marginRight: '15px',
  },
  textContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#111',
    marginBottom: '2px',
  },
  roleDesc: {
    fontSize: '13px',
    color: '#888',
  },
  arrow: {
    color: '#CCC',
    fontSize: '18px',
    marginLeft: '10px',
  }
};
import React from 'react';

export const DashboardHeader = ({ title, isSafe, childName, childAvatar, childPhotoUrl }) => {
  return (
    <div
      style={{
        background: isSafe
          ? 'linear-gradient(135deg, #4A90E2, #1F77D3)'
          : 'linear-gradient(135deg, #FF5E5B, #D93E2D)',
        padding: '24px 22px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px',
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
      }}
    >
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '18px',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.24)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {childPhotoUrl ? (
            <img src={childPhotoUrl} alt="child" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '22px' }}>{childAvatar}</span>
          )}
        </div>
        <div>
          <div style={{ fontSize: '12px', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Child Profile</div>
          <div style={{ fontSize: '18px', fontWeight: '700' }}>{childName}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '13px', opacity: 0.92 }}>{isSafe ? 'Protected zone active' : 'Attention required'}</div>
      </div>
    </div>
  );
};

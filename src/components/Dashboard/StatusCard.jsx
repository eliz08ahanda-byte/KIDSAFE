import React from 'react';

export const StatusCard = ({ isSafe, childName, childAge, childAvatar, childPhotoUrl }) => {
  return (
    <div
      style={{
        backgroundColor: 'white',
        padding: '22px',
        borderRadius: '26px',
        marginBottom: '22px',
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
        boxShadow: '0 20px 48px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          background: '#EFF6FF',
          borderRadius: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {childPhotoUrl ? (
          <img src={childPhotoUrl} alt="child" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '30px' }}>{childAvatar}</span>
        )}
      </div>
      <div style={{ flexGrow: 1 }}>
        <div style={{ marginBottom: '8px', fontSize: '14px', color: '#6B7280' }}>Watcher Profile</div>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>
          {childName}
        </h2>
        <div style={{ marginTop: '5px', color: '#4B5563', fontSize: '14px' }}>{childAge}</div>
      </div>
      <div
        style={{
          color: isSafe ? '#047857' : '#B91C1C',
          backgroundColor: isSafe ? '#D1FAE5' : '#FEE2E2',
          fontWeight: '700',
          padding: '10px 18px',
          borderRadius: '999px',
          fontSize: '13px',
        }}
      >
        {isSafe ? 'Safe' : 'Outside Zone'}
      </div>
    </div>
  );
};

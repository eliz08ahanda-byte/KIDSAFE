import React from 'react';

export const ActivitySummary = ({ distance = '8.6 km', timeOutdoor = '5h 32m' }) => {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #4A90E2 0%, #3B82F6 100%)',
        padding: '22px',
        borderRadius: '24px',
        color: 'white',
        marginBottom: '24px',
        boxShadow: '0 18px 44px rgba(59, 130, 246, 0.18)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
        <div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700' }}>Today's Activity</h4>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.92, maxWidth: '420px' }}>
            Keep track of the journey and how long {timeOutdoor === '5h 32m' ? 'today' : ''} has been outdoors.
          </p>
        </div>
        <div style={{ display: 'grid', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '999px', background: '#93C5FD' }} />
            <span style={{ fontSize: '14px', opacity: 0.95 }}>{distance} distance</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '999px', background: '#BFDBFE' }} />
            <span style={{ fontSize: '14px', opacity: 0.95 }}>{timeOutdoor} outdoors</span>
          </div>
        </div>
      </div>
    </div>
  );
};

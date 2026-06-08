import React from 'react';

export const StatsGrid = ({ battery = 0, speed = 3, location = 'Unknown', safetyScore = 92 }) => {
  const cards = [
    { icon: '🔋', label: 'Battery', value: `${battery}%`, accent: '#FDE68A' },
    { icon: '⚡', label: 'Speed', value: `${speed} km/h`, accent: '#BFDBFE' },
    { icon: '📍', label: 'Location', value: location, accent: '#C7D2FE' },
    { icon: '🛡️', label: 'Safety Score', value: `${safetyScore}%`, accent: '#D1FAE5' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            background: 'white',
            padding: '18px',
            borderRadius: '22px',
            boxShadow: '0 18px 32px rgba(15, 23, 42, 0.06)',
            borderLeft: `4px solid ${card.accent}`,
            minHeight: '124px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                display: 'grid',
                placeItems: 'center',
                background: '#F8FAFC',
                fontSize: '18px',
              }}
            >
              {card.icon}
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#4B5563' }}>{card.label}</div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827', lineHeight: 1.2 }}>{card.value}</div>
        </div>
      ))}
    </div>
  );
};

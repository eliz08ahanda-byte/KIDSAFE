import React, { useState } from 'react';
import { onSnapshot, doc, updateDoc, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { DashboardHeader, StatusCard, StatsGrid, ActivitySummary, SOSAlert } from './index';
import { SettingsPanel } from './SettingsPanel';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Leaflet Icon Setup
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapController = ({ lat, lng }) => {
  const map = useMap();
  React.useEffect(() => {
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      setTimeout(() => {
        map.invalidateSize();
        map.setView([lat, lng], 15);
      }, 300);
    }
  }, [lat, lng, map]);
  return null;
};

const formatEventTime = (value) => {
  if (!value) return 'Unknown time';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const TrackerDashboard = ({ parentConfig, onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');

  const children = React.useMemo(() => {
    if (parentConfig?.children && Array.isArray(parentConfig.children))
      return parentConfig.children;
    if (parentConfig?.childName) {
      return [
        {
          id: parentConfig.uid || 'child_001',
          name: parentConfig.childName,
          age: parentConfig.childAge,
          avatar: parentConfig.childAvatar || '👦',
          photoUrl: parentConfig.childPhotoUrl || null,
        },
      ];
    }
    return [];
  }, [parentConfig]);

  const defaultChildId = React.useMemo(() => {
    if (children.length > 0) return parentConfig?.uid || children[0].id;
    return parentConfig?.uid || '';
  }, [children, parentConfig]);

  const [selectedChildId] = useState(defaultChildId);
  const activeChildId = selectedChildId || defaultChildId;

  // Default coordinate initialization fallback centered around standard tracking view
  const [childData, setChildData] = useState({
    battery: 100,
    latitude: 3.8834,
    longitude: 11.5528,
    fence_lat: 3.8834,
    fence_lng: 11.5528,
    fence_radius: 500,
    sos: false,
  });
  const [isSafe, setIsSafe] = useState(true);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // LIVE COORDINATES LISTENER FROM ESP32 SLOTS
  React.useEffect(() => {
    // FORCE UPDATE: Explicitly listen to your parent account User ID string path
    const targetDocId = activeChildId;
    if (!db || !targetDocId) return;

    console.log('Dashboard listening to Firestore path: parents/' + targetDocId);

    const unsubLive = onSnapshot(doc(db, 'parents', targetDocId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Live telemetry streams parsed from Firestore:', data);

        // Convert input coordinates explicitly from text strings to numeric doubles
        const normalizedData = {
          ...data,
          latitude: data.latitude ? Number(data.latitude) : 3.8834,
          longitude: data.longitude ? Number(data.longitude) : 11.5528,
          fence_lat: data.fence_lat
            ? Number(data.fence_lat)
            : data.latitude
              ? Number(data.latitude)
              : 3.8834,
          fence_lng: data.fence_lng
            ? Number(data.fence_lng)
            : data.longitude
              ? Number(data.longitude)
              : 11.5528,
          fence_radius: data.fence_radius ? Number(data.fence_radius) : 500,
          sos: data.sos || false,
          battery: data.battery || 100,
        };

        setChildData(normalizedData);

        if (normalizedData.latitude && normalizedData.fence_lat) {
          const lat1 = normalizedData.latitude;
          const lon1 = normalizedData.longitude;
          const lat2 = normalizedData.fence_lat;
          const lon2 = normalizedData.fence_lng;
          const R = 6371e3;
          const φ1 = (lat1 * Math.PI) / 180;
          const φ2 = (lat2 * Math.PI) / 180;
          const Δφ = ((lat2 - lat1) * Math.PI) / 180;
          const Δλ = ((lon2 - lon1) * Math.PI) / 180;
          const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
          const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
          setIsSafe(dist <= normalizedData.fence_radius);
        }
      }
    });

    return () => unsubLive();
  }, [activeChildId]);

  // HISTORICAL TIMELINE STREAM
  React.useEffect(() => {
    const targetDocId = activeChildId;
    if (!db || !targetDocId) return;

    const historyCollection = collection(db, 'parents', targetDocId, 'history');
    const historyQuery = query(historyCollection, orderBy('timestamp', 'desc'), limit(12));

    const unsubscribeHistory = onSnapshot(
      historyQuery,
      (snapshot) => {
        const events = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const timestamp = data.timestamp?.toDate
            ? data.timestamp.toDate()
            : data.timestamp || new Date();
          return {
            id: docSnap.id,
            eventType: data.eventType || 'Update',
            latitude: data.latitude ? Number(data.latitude) : null,
            longitude: data.longitude ? Number(data.longitude) : null,
            notes: data.notes || '',
            timestamp,
            zoneStatus:
              data.zoneStatus || (data.outsideZone ? 'Outside Safe Zone' : 'Inside Safe Zone'),
          };
        });
        setHistoryEvents(events);
        setHistoryLoading(false);
      },
      (error) => {
        console.error('History load error', error);
        setHistoryLoading(false);
      }
    );

    return () => unsubscribeHistory();
  }, [activeChildId]);

  const isSOS = childData?.sos === true || String(childData?.sos).toLowerCase() === 'true';

  const selectedChild = children.find((child) => child.id === activeChildId) ||
    children[0] || {
      id: 'child_001',
      name: 'Child',
      age: 8,
      avatar: '👦',
      photoUrl: null,
    };

  const childName = selectedChild.name || 'Child';
  const childAge = selectedChild.age ? `${selectedChild.age} yrs` : '8 yrs';
  const childAvatar = selectedChild.avatar || '👦';
  const childPhotoUrl = selectedChild.photoUrl || null;
  const sosRingtone = parentConfig?.sosRingtone || 'classic';
  const safetyZone = parentConfig?.safetyZone || {};
  const safePlaces = parentConfig?.safePlaces || [];
  const zoneLatitude = Number(safetyZone.lat) || childData?.fence_lat || null;
  const zoneLongitude = Number(safetyZone.lng) || childData?.fence_lng || null;
  const zoneRadius = Number(safetyZone.radius) || childData?.fence_radius || 500;

  return (
    <div
      style={{
        backgroundColor: '#F3F7FF',
        backgroundImage:
          'radial-gradient(circle at top left, rgba(74, 144, 226, 0.08), transparent 38%), radial-gradient(circle at bottom right, rgba(69, 139, 222, 0.06), transparent 30%)',
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, sans-serif',
        paddingBottom: '90px',
        boxSizing: 'border-box',
        color: '#1F2937',
      }}
    >
      {isSOS && (
        <SOSAlert
          childName={childName}
          childId={activeChildId}
          ringtone={sosRingtone}
          onDismiss={() => setChildData((prev) => ({ ...prev, sos: false }))}
        />
      )}

      {activeTab === 'home' && (
        <div>
          <DashboardHeader
            title="Home Dashboard"
            isSafe={isSafe}
            childName={childName}
            childAvatar={childAvatar}
            childPhotoUrl={childPhotoUrl}
          />
          <div style={{ padding: '20px' }}>
            <StatusCard
              isSafe={isSafe}
              childName={childName}
              childAge={childAge}
              childAvatar={childAvatar}
              childPhotoUrl={childPhotoUrl}
            />
            <StatsGrid battery={childData?.battery || 100} location="Live Connected Area" />
            <ActivitySummary />

            <button
              onClick={() => {
                if (db) {
                  const targetDocId = activeChildId;
                  updateDoc(doc(db, 'parents', targetDocId), { sos: true });
                }
              }}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: '#FF3B30',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginBottom: '20px',
              }}
            >
              🚨 TEST SOS ALERT
            </button>

            <div
              style={{
                backgroundColor: 'white',
                padding: '22px',
                borderRadius: '24px',
                marginBottom: '22px',
                boxShadow: '0 16px 36px rgba(15, 23, 42, 0.06)',
              }}
            >
              <h4 style={{ margin: '0 0 16px 0', color: '#0F172A' }}>Live Location Map</h4>
              <MapContainer
                center={[childData?.latitude || 3.8834, childData?.longitude || 11.5528]}
                zoom={15}
                style={{ height: '340px', borderRadius: '18px' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapController lat={childData?.latitude} lng={childData?.longitude} />
                <Marker
                  position={[childData?.latitude || 3.8834, childData?.longitude || 11.5528]}
                />
                <Circle
                  center={[childData?.fence_lat || 3.8834, childData?.fence_lng || 11.5528]}
                  radius={childData?.fence_radius || 500}
                  color={isSafe ? '#4A90E2' : '#FF3B30'}
                  fillOpacity={0.2}
                />
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'map' && (
        <div style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '18px',
            }}
          >
            <div>
              <h2 style={{ margin: 0, color: '#2C3E50' }}>Live Map</h2>
              <p style={{ margin: '6px 0 0', color: '#6B7280' }}>
                Track your child in real time and review the current safe zone.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: isSafe ? '#16A34A' : '#DC2626', fontWeight: '700' }}>
                {isSafe ? 'Inside Safe Zone' : 'Outside Safe Zone'}
              </div>
              <div
                style={{ color: '#6B7280', fontSize: '13px' }}
              >{`Battery ${childData?.battery || 100}%`}</div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '18px',
              marginBottom: '22px',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '24px',
                padding: '20px',
                boxShadow: '0 18px 36px rgba(15, 23, 42, 0.06)',
              }}
            >
              <h3 style={{ margin: '0 0 12px 0', color: '#2C3E50' }}>Child Location</h3>
              <p style={{ margin: '0 0 10px', color: '#6B7280' }}>
                Last known location of {childName}.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '700' }}>Lat:</span>
                <span>{childData?.latitude || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '700' }}>Lng:</span>
                <span>{childData?.longitude || 'N/A'}</span>
              </div>
            </div>
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '18px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
              }}
            >
              <h3 style={{ margin: '0 0 12px 0', color: '#2C3E50' }}>Safe Zone</h3>
              <p style={{ margin: '0 0 10px', color: '#6B7280' }}>
                {safetyZone.name || 'Current Boundary'} • {zoneRadius} meters radius
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '700' }}>Center:</span>
                <span>
                  {zoneLatitude && zoneLongitude
                    ? `${zoneLatitude.toFixed(5)}, ${zoneLongitude.toFixed(5)}`
                    : 'Syncing...'}
                </span>
              </div>
              <div style={{ marginTop: '12px', color: '#4A90E2', fontWeight: '700' }}>
                {safePlaces.length} Safe place{safePlaces.length === 1 ? '' : 's'} configured
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              padding: '14px',
              borderRadius: '20px',
              overflow: 'hidden',
              marginBottom: '20px',
            }}
          >
            <MapContainer
              center={[childData?.latitude || 3.8834, childData?.longitude || 11.5528]}
              zoom={14}
              style={{ height: '420px', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapController lat={childData?.latitude} lng={childData?.longitude} />
              <Marker position={[childData?.latitude || 3.8834, childData?.longitude || 11.5528]} />
              {zoneLatitude && zoneLongitude && (
                <>
                  <Circle
                    center={[zoneLatitude, zoneLongitude]}
                    radius={zoneRadius}
                    color={isSafe ? '#4A90E2' : '#FF3B30'}
                    fillOpacity={0.15}
                  />
                </>
              )}
            </MapContainer>
          </div>

          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '18px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
              }}
            >
              <h3 style={{ margin: '0 0 12px 0', color: '#2C3E50' }}>Quick Actions</h3>
              <button
                onClick={() => {
                  if (db) {
                    const targetDocId = activeChildId;
                    updateDoc(doc(db, 'parents', targetDocId), { sos: true });
                  }
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: '#EF4444',
                  color: 'white',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, background-color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#DC2626')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#EF4444')}
              >
                Trigger SOS Alert
              </button>
            </div>
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '18px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
              }}
            >
              <h3 style={{ margin: '0 0 12px 0', color: '#2C3E50' }}>Safe Places</h3>
              {safePlaces.length === 0 ? (
                <p style={{ color: '#6B7280', margin: 0 }}>No safe places configured yet.</p>
              ) : (
                <ul style={{ paddingLeft: '18px', margin: 0, color: '#34495E' }}>
                  {safePlaces.map((place, index) => (
                    <li key={`${place}-${index}`} style={{ marginBottom: '8px' }}>
                      {place}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ margin: 0, color: '#2C3E50' }}>Activity History</h2>
            <p style={{ margin: '8px 0 0', color: '#6B7280' }}>
              Review the latest location updates, zone checks, and important events.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '16px',
              marginBottom: '20px',
              gridTemplateColumns: '1fr 1fr',
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '18px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
              }}
            >
              <h3 style={{ margin: '0 0 12px 0', color: '#2C3E50' }}>Recent Events</h3>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                {historyEvents.length}
              </div>
              <div style={{ marginTop: '8px', color: '#6B7280' }}>
                Most recent location updates available.
              </div>
            </div>
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '18px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
              }}
            >
              <h3 style={{ margin: '0 0 12px 0', color: '#2C3E50' }}>Latest Status</h3>
              <div
                style={{
                  color: isSafe ? '#16A34A' : '#DC2626',
                  fontWeight: '700',
                  fontSize: '18px',
                }}
              >
                {isSafe ? 'Currently Safe' : 'Check Zone Alert'}
              </div>
              <div
                style={{ marginTop: '8px', color: '#6B7280' }}
              >{`Current battery: ${childData?.battery || 100}%`}</div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '18px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <h3 style={{ margin: 0, color: '#2C3E50' }}>Timeline</h3>
              <span style={{ color: '#6B7280', fontSize: '14px' }}>
                {historyLoading ? 'Loading...' : `${historyEvents.length} records`}
              </span>
            </div>
            {historyLoading ? (
              <p style={{ color: '#6B7280', margin: 0 }}>Fetching history events...</p>
            ) : historyEvents.length === 0 ? (
              <p style={{ color: '#6B7280', margin: 0 }}>
                No history data found yet. Make sure your tracker is sending updates.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                {historyEvents.map((event) => (
                  <div
                    key={event.id}
                    style={{ padding: '14px', borderRadius: '16px', backgroundColor: '#F8FAFF' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', color: '#111827' }}>{event.eventType}</div>
                        <div style={{ color: '#6B7280', fontSize: '13px' }}>
                          {formatEventTime(event.timestamp)}
                        </div>
                      </div>
                      <div
                        style={{
                          color: event.zoneStatus?.includes('Outside') ? '#DC2626' : '#16A34A',
                          fontWeight: '700',
                        }}
                      >
                        {event.zoneStatus}
                      </div>
                    </div>
                    <div style={{ color: '#374151', fontSize: '14px', marginBottom: '8px' }}>
                      {event.notes ||
                        `${event.latitude ? `Lat ${event.latitude}` : 'Lat N/A'}, ${event.longitude ? `Lng ${event.longitude}` : 'Lng N/A'}`}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#6B7280', fontSize: '13px' }}>ID: {event.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gap: '16px',
              gridTemplateColumns: '1fr',
              marginBottom: '120px',
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '18px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
              }}
            >
              <h3 style={{ margin: '0 0 12px 0', color: '#2C3E50' }}>Route Summary</h3>
              <p style={{ margin: '0', color: '#6B7280' }}>
                Keep an eye on the most recent path and boundary checks for {childName}.
              </p>
              <div style={{ marginTop: '14px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div
                  style={{
                    backgroundColor: '#EEF2FF',
                    borderRadius: '14px',
                    padding: '12px',
                    flex: '1 1 120px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>
                    Latest update
                  </div>
                  <div style={{ fontWeight: '700', color: '#111827' }}>
                    {historyEvents[0]?.eventType || 'No data'}
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: '#EEF2FF',
                    borderRadius: '14px',
                    padding: '12px',
                    flex: '1 1 120px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>
                    Current zone
                  </div>
                  <div style={{ fontWeight: '700', color: isSafe ? '#16A34A' : '#DC2626' }}>
                    {isSafe ? 'Safe' : 'Alert'}
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: '#EEF2FF',
                    borderRadius: '14px',
                    padding: '12px',
                    flex: '1 1 120px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>
                    Battery
                  </div>
                  <div
                    style={{ fontWeight: '700', color: '#111827' }}
                  >{`${childData?.battery || 100}%`}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div style={{ padding: '0 20px 160px 20px' }}>
          <SettingsPanel parentConfig={parentConfig} />
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <button
              onClick={onLogout}
              style={{
                padding: '12px 20px',
                backgroundColor: '#FF3B30',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '10px 0',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
          borderTop: '1px solid #EEE',
        }}
      >
        <button
          onClick={() => setActiveTab('home')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: activeTab === 'home' ? '#F0F4FF' : 'transparent',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
          }}
        >
          🏠
        </button>
        <button
          onClick={() => setActiveTab('map')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: activeTab === 'map' ? '#F0F4FF' : 'transparent',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
          }}
        >
          📍
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: activeTab === 'history' ? '#F0F4FF' : 'transparent',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
          }}
        >
          📊
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: activeTab === 'settings' ? '#F0F4FF' : 'transparent',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
          }}
        >
          ⚙️
        </button>
      </div>
    </div>
  );
};

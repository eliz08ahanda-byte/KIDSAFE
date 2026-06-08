/* eslint-disable react-hooks/static-components */
import { useEffect, useState } from 'react';
import { auth, db, storage } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { MapContainer, TileLayer, Marker, Circle, useMapEvent } from 'react-leaflet';
import kuatePhoto from '../../assets/team-photos/FREDDY.jpeg';
import fotsingPhoto from '../../assets/team-photos/HUGUETTE.jpeg';
import ahandaPhoto from '../../assets/team-photos/Elisabeth.jpeg';
import imouckPhoto from '../../assets/team-photos/ROSALINE.jpeg';
import ndamPhoto from '../../assets/team-photos/ARNOLD.jpeg';
const DEFAULT_DEV_TEAM = [
  {
    name: 'Kuate Freddy',
    role: 'CTO',
    contact: 'freddykuate19@gmail.com',
    phone: '697517478',
    photo: kuatePhoto,
    avatar: 'KF',
  },
  {
    name: 'Fotsing Hugeutte',
    role: 'Backend Designer',
    contact: 'fotsingmatakouhuguette@gmail.com',
    phone: '678054624',
    photo: fotsingPhoto,
    avatar: 'FH',
  },
  {
    name: 'Ahanda Elisabeth',
    role: 'Scrum master and Frontend Designer',
    contact: 'ahanda.bergile@ictuniversity.edu.cm',
    phone: '651827090',
    photo: ahandaPhoto,
    avatar: 'AE',
  },
  {
    name: 'Imouck Njoh Rosaline',
    role: 'Product Owner and Frontend designer',
    contact: 'rosalineimouck@icloud.com',
    phone: '694024188',
    photo: imouckPhoto,
    avatar: 'INR',
  },
  {
    name: 'Ndam Arnold Atefor',
    role: 'Backend designer',
    contact: 'nam.arnold@ictuniversity.edu.cm',
    phone: '651966446',
    photo: ndamPhoto,
    avatar: 'NA',
  },
];

const sectionStyle = {
  backgroundColor: 'white',
  borderRadius: '20px',
  padding: '18px',
  marginBottom: '20px',
  boxShadow: '0 6px 20px rgba(0,0,0,0.04)',
};

const sectionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  marginBottom: '18px',
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid #D1D9E6',
  fontSize: '14px',
  marginBottom: '12px',
  boxSizing: 'border-box',
  backgroundColor: '#FFFFFF',
  color: '#000000',
};

const toggleStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 0',
  borderBottom: '1px solid #EEF2F7',
};

export const SettingsPanel = ({ parentConfig }) => {
  const [zoneName, setZoneName] = useState('Home Zone');
  const [zoneLat, setZoneLat] = useState('');
  const [zoneLng, setZoneLng] = useState('');
  const CHILD_AVATARS = ['👦', '👧', '👶', '🐱', '🦊'];
  const SOS_RINGTONE_OPTIONS = [
    { value: 'classic', label: 'Classic Ring' },
    { value: 'alarm', label: 'Alarm Beep' },
    { value: 'soft', label: 'Soft Chime' },
  ];

  const [locationLabel, setLocationLabel] = useState('No location selected');
  const [zoneRadius, setZoneRadius] = useState('500');
  const [safePlace, setSafePlace] = useState('');
  const [safePlaces, setSafePlaces] = useState([]);
  const [notifications, setNotifications] = useState({
    zoneAlert: true,
    batteryAlert: true,
    arrivalDeparture: true,
    sosAlert: true,
  });
  const [emergencyContact, setEmergencyContact] = useState({ name: '', phone: '' });
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [childDraft, setChildDraft] = useState({
    id: '',
    name: '',
    age: '',
    avatar: '👦',
    photoUrl: '',
    photoPreview: null,
  });
  const [childPhotoFile, setChildPhotoFile] = useState(null);
  const [appTheme, setAppTheme] = useState('light');
  const [sosRingtone, setSosRingtone] = useState('classic');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState({
    safety: true,
    notifications: false,
    general: false,
    about: false,
  });

  useEffect(() => {
    if (!parentConfig) return;

    const {
      safetyZone = {},
      safePlaces: savedSafePlaces = [],
      notificationSettings = {},
      emergencyContact: savedContact = {},
      children: savedChildren = [],
      currentChildId,
      appTheme: savedTheme,
      sosRingtone: savedRingtone,
    } = parentConfig;

    const formattedChildren = Array.isArray(savedChildren)
      ? savedChildren.map((child) => ({
          ...child,
          age: child.age?.toString() || '',
          photoUrl: child.photoUrl || '',
        }))
      : [];

    const fallbackChild = parentConfig.childName
      ? [
          {
            id: currentChildId || 'child_001',
            name: parentConfig.childName,
            age: parentConfig.childAge?.toString() || '',
            avatar: parentConfig.childAvatar || '👦',
            photoUrl: parentConfig.childPhotoUrl || '',
          },
        ]
      : [];

    const childList = formattedChildren.length > 0 ? formattedChildren : fallbackChild;
    const selectedId = currentChildId || (childList[0] && childList[0].id) || '';
    const selectedChild = childList.find((child) => child.id === selectedId) ||
      childList[0] || {
        id: '',
        name: '',
        age: '',
        avatar: '👦',
        photoUrl: '',
      };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZoneName(safetyZone.name || 'Home Zone');
    setZoneLat(safetyZone.lat?.toString() || '');
    setZoneLng(safetyZone.lng?.toString() || '');
    setLocationLabel(
      safetyZone.lat && safetyZone.lng
        ? `Latitude: ${safetyZone.lat.toFixed ? safetyZone.lat.toFixed(5) : safetyZone.lat}, Longitude: ${safetyZone.lng.toFixed ? safetyZone.lng.toFixed(5) : safetyZone.lng}`
        : 'No location selected'
    );
    setZoneRadius(safetyZone.radius?.toString() || '500');
    setSafePlaces(savedSafePlaces || []);
    setNotifications({
      zoneAlert: notificationSettings.zoneAlert ?? true,
      batteryAlert: notificationSettings.batteryAlert ?? true,
      arrivalDeparture: notificationSettings.arrivalDeparture ?? true,
      sosAlert: notificationSettings.sosAlert ?? true,
    });
    setEmergencyContact({
      name: savedContact.name || '',
      phone: savedContact.phone || '',
    });
    setChildren(childList);
    setSelectedChildId(selectedId);
    setChildDraft({
      id: selectedChild.id || '',
      name: selectedChild.name || '',
      age: selectedChild.age || '',
      avatar: selectedChild.avatar || '👦',
      photoUrl: selectedChild.photoUrl || '',
      photoPreview: selectedChild.photoUrl || null,
    });
    setChildPhotoFile(null);
    setAppTheme(savedTheme || 'light');
    setSosRingtone(savedRingtone || 'classic');
  }, [parentConfig]);

  const updateSettings = async (changes) => {
    if (!auth.currentUser) return;
    setSaving(true);
    setMessage('');

    try {
      const parentRef = doc(db, 'parents', auth.currentUser.uid);
      await updateDoc(parentRef, changes);
      setMessage('Settings saved successfully.');
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage('Unable to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSafetyZone = async (e) => {
    e.preventDefault();
    await updateSettings({
      safetyZone: {
        name: zoneName,
        lat: parseFloat(zoneLat) || 0,
        lng: parseFloat(zoneLng) || 0,
        radius: parseInt(zoneRadius, 10) || 500,
      },
      safePlaces,
    });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Geolocation is not available in your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setZoneLat(lat.toString());
        setZoneLng(lng.toString());
        setLocationLabel(`Current location selected (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        setMessage('Location selected from device GPS.');
      },
      (err) => {
        console.error('Geolocation error:', err);
        setMessage('Unable to get current location. Please allow location access.');
      }
    );
  };

  const handleMapSelect = (latlng) => {
    setZoneLat(latlng.lat.toString());
    setZoneLng(latlng.lng.toString());
    setLocationLabel(`Selected location (${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)})`);
    setMessage('Location selected from map.');
  };

  const handleChildPhotoFile = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setChildPhotoFile(null);
      setChildDraft((prev) => ({ ...prev, photoPreview: prev.photoUrl || null }));
      return;
    }

    setChildPhotoFile(file);
    setChildDraft((prev) => ({ ...prev, photoUrl: '' }));
    try {
      const url = URL.createObjectURL(file);
      setChildDraft((prev) => ({ ...prev, photoPreview: url }));
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setChildDraft((prev) => ({ ...prev, photoPreview: null }));
    }
  };

  const handleRemovePhoto = () => {
    setChildPhotoFile(null);
    setChildDraft((prev) => ({ ...prev, photoUrl: '', photoPreview: null }));
  };

  const handleSelectChild = (childId) => {
    const child = children.find((item) => item.id === childId);
    if (!child) return;
    setSelectedChildId(childId);
    setChildDraft({
      id: child.id,
      name: child.name || '',
      age: child.age?.toString() || '',
      avatar: child.avatar || '👦',
      photoUrl: child.photoUrl || '',
      photoPreview: child.photoUrl || null,
    });
    setChildPhotoFile(null);
  };

  const handleNewChild = () => {
    setSelectedChildId('');
    setChildDraft({
      id: '',
      name: '',
      age: '',
      avatar: '👦',
      photoUrl: '',
      photoPreview: null,
    });
    setChildPhotoFile(null);
  };

  const handleDeleteChild = (childId) => {
    if (children.length <= 1) {
      setMessage('At least one child profile must remain.');
      return;
    }
    const remaining = children.filter((child) => child.id !== childId);
    setChildren(remaining);
    const nextSelected = remaining[0];
    setSelectedChildId(nextSelected.id);
    setChildDraft({
      id: nextSelected.id,
      name: nextSelected.name || '',
      age: nextSelected.age?.toString() || '',
      avatar: nextSelected.avatar || '👦',
      photoUrl: nextSelected.photoUrl || '',
      photoPreview: nextSelected.photoUrl || null,
    });
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const ZoneMap = ({ lat, lng, radius, onSelect }) => {
    const defaultPosition = lat && lng ? [Number(lat), Number(lng)] : [0, 0];
    const zoom = lat && lng ? 13 : 2;

    function MapClickHandler() {
      useMapEvent('click', (event) => {
        onSelect(event.latlng);
      });
      return null;
    }

    return (
      <MapContainer
        center={defaultPosition}
        zoom={zoom}
        style={{ height: '240px', width: '100%', borderRadius: '16px' }}
        scrollWheelZoom={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapClickHandler />
        {lat && lng && (
          <>
            <Marker position={[Number(lat), Number(lng)]} />
            <Circle
              center={[Number(lat), Number(lng)]}
              radius={Number(radius) || 500}
              pathOptions={{ color: '#4A90E2', fillOpacity: 0.2 }}
            />
          </>
        )}
      </MapContainer>
    );
  };

  const handleAddSafePlace = () => {
    if (!safePlace.trim()) return;
    setSafePlaces((prev) => [...prev, safePlace.trim()]);
    setSafePlace('');
  };

  const handleToggleNotification = async (key) => {
    const nextSettings = { ...notifications, [key]: !notifications[key] };
    setNotifications(nextSettings);
    await updateSettings({ notificationSettings: nextSettings });
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSaving(true);
    setMessage('');

    const draftName = childDraft.name.trim();
    const draftAge = childDraft.age.trim();
    if (!draftName && children.length === 0) {
      setMessage('Please add at least one child profile before saving.');
      setSaving(false);
      return;
    }

    let photoUrl = childDraft.photoUrl || null;
    let nextChildren = [...children];
    let nextSelectedChildId = selectedChildId;

    if (childDraft.id || draftName) {
      const childId = childDraft.id || `child_${Date.now()}`;
      if (childPhotoFile && storage && auth.currentUser) {
        try {
          const path = `parents/${auth.currentUser.uid}/${childId}`;
          const sRef = storageRef(storage, path);
          const uploadTask = uploadBytesResumable(sRef, childPhotoFile);

          await new Promise((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              null,
              (err) => reject(err),
              () => resolve()
            );
          });

          photoUrl = await getDownloadURL(uploadTask.snapshot.ref);
        } catch (err) {
          console.error('Photo upload failed:', err);
          setMessage('Unable to upload photo. Please try again.');
          setSaving(false);
          return;
        }
      }

      const childData = {
        id: childId,
        name: draftName,
        age: parseInt(draftAge, 10) || undefined,
        avatar: childDraft.avatar,
        photoUrl,
      };

      const existingIndex = nextChildren.findIndex((child) => child.id === childId);
      if (existingIndex >= 0) {
        nextChildren[existingIndex] = childData;
      } else {
        nextChildren.push(childData);
      }
      nextSelectedChildId = childId;
      setChildren(nextChildren);
      setSelectedChildId(childId);
      setChildDraft({
        ...childData,
        age: childData.age?.toString() || '',
        photoPreview: childData.photoUrl || null,
      });
      setChildPhotoFile(null);
    }

    const activeChild =
      nextChildren.find((child) => child.id === nextSelectedChildId) || nextChildren[0] || {};

    await updateSettings({
      emergencyContact,
      children: nextChildren,
      currentChildId: nextSelectedChildId || activeChild.id || '',
      sosRingtone,
      childName: activeChild.name || undefined,
      childAge: activeChild.age || undefined,
      childAvatar: activeChild.avatar || undefined,
      childPhotoUrl: activeChild.photoUrl || null,
      appTheme,
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '18px', color: '#2C3E50' }}>Settings</h2>

      <section style={sectionStyle}>
        <div style={sectionHeaderStyle} onClick={() => toggleSection('safety')}>
          <div>
            <h3 style={{ margin: 0 }}>Safety Zone</h3>
            <p style={{ color: '#6B7280', margin: '4px 0 0 0' }}>
              Configure your child's safe zone and preferred safe places.
            </p>
          </div>
          <div style={{ fontSize: '20px' }}>{openSections.safety ? '−' : '+'}</div>
        </div>

        {openSections.safety && (
          <form onSubmit={handleSaveSafetyZone}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Safe Zone Name
            </label>
            <input
              style={inputStyle}
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
            />
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px', fontWeight: 600 }}>Selected Zone Center</div>
              <div
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #D1D9E6',
                  backgroundColor: '#F7FAFC',
                }}
              >
                {locationLabel}
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#4A90E2',
                    color: 'white',
                    cursor: 'pointer',
                    flex: '1 1 auto',
                  }}
                >
                  Use Current Location
                </button>
                <button
                  type="button"
                  onClick={() => setMessage('Tap the map to select a location.')}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '12px',
                    border: '1px solid #4A90E2',
                    backgroundColor: 'white',
                    color: '#4A90E2',
                    cursor: 'pointer',
                    flex: '1 1 auto',
                  }}
                >
                  Select On Map
                </button>
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              // eslint-disable-next-line react-hooks/static-components
              <ZoneMap lat={zoneLat} lng={zoneLng} radius={zoneRadius} onSelect={handleMapSelect} />
              <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#6B7280' }}>
                Tap the map to place the zone center. The blue circle shows the safe radius in
                meters.
              </p>
            </div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Radius (meters)
            </label>
            <input
              style={inputStyle}
              type="number"
              value={zoneRadius}
              onChange={(e) => setZoneRadius(e.target.value)}
              min="100"
            />
            <p style={{ margin: '0 0 12px 0', color: '#6B7280', fontSize: '13px' }}>
              This defines the safe area radius in meters. If the child leaves this zone, you will
              get an alert.
            </p>
            <div style={{ marginTop: '16px', marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                Safe Places
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                  value={safePlace}
                  onChange={(e) => setSafePlace(e.target.value)}
                  placeholder="Add a place name"
                />
                <button
                  type="button"
                  onClick={handleAddSafePlace}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#4A90E2',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
              </div>
              {safePlaces.length > 0 && (
                <ul style={{ marginTop: '12px', paddingLeft: '18px', color: '#34495E' }}>
                  {safePlaces.map((place, index) => (
                    <li key={`${place}-${index}`} style={{ marginBottom: '6px' }}>
                      {place}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '14px 22px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: '#4A90E2',
                color: 'white',
                fontWeight: '700',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save Safety Zone'}
            </button>
          </form>
        )}
      </section>

      <section style={sectionStyle}>
        <div style={sectionHeaderStyle} onClick={() => toggleSection('notifications')}>
          <div>
            <h3 style={{ margin: 0 }}>Notifications</h3>
            <p style={{ color: '#6B7280', margin: '4px 0 0 0' }}>
              Choose which alerts you want to receive for your child.
            </p>
          </div>
          <div style={{ fontSize: '20px' }}>{openSections.notifications ? '−' : '+'}</div>
        </div>

        {openSections.notifications && (
          <div>
            {[
              { label: 'Zone Alerts', key: 'zoneAlert' },
              { label: 'Battery Alerts', key: 'batteryAlert' },
              { label: 'Arrival / Departure Alerts', key: 'arrivalDeparture' },
              { label: 'SOS Alerts', key: 'sosAlert' },
            ].map((item) => (
              <div key={item.key} style={toggleStyle}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.label}</div>
                  <div style={{ color: '#6B7280', fontSize: '13px' }}>
                    {item.key === 'arrivalDeparture'
                      ? 'Notifications for entering or leaving safe zones.'
                      : item.key === 'sosAlert'
                        ? 'Receive alerts when SOS is pressed.'
                        : item.key === 'batteryAlert'
                          ? 'Low battery warning for your child tracker.'
                          : 'Alerts when your child leaves the safe zone.'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification(item.key)}
                  style={{
                    width: '50px',
                    height: '28px',
                    borderRadius: '999px',
                    border: '1px solid #D1D9E6',
                    backgroundColor: notifications[item.key] ? '#4A90E2' : '#F1F5F9',
                    color: notifications[item.key] ? 'white' : '#6B7280',
                    cursor: 'pointer',
                  }}
                >
                  {notifications[item.key] ? 'On' : 'Off'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={sectionStyle}>
        <div style={sectionHeaderStyle} onClick={() => toggleSection('general')}>
          <div>
            <h3 style={{ margin: 0 }}>General</h3>
            <p style={{ color: '#6B7280', margin: '4px 0 0 0' }}>
              Emergency contact, child profile, theme preferences and developer info.
            </p>
          </div>
          <div style={{ fontSize: '20px' }}>{openSections.general ? '−' : '+'}</div>
        </div>

        {openSections.general && (
          <form onSubmit={handleSaveGeneral}>
            <div style={{ marginBottom: '18px' }}>
              <h4 style={{ margin: '0 0 12px 0' }}>Emergency Contact</h4>
              <input
                style={inputStyle}
                placeholder="Contact name"
                value={emergencyContact.name}
                onChange={(e) => setEmergencyContact((prev) => ({ ...prev, name: e.target.value }))}
              />
              <input
                style={inputStyle}
                placeholder="Phone number"
                value={emergencyContact.phone}
                onChange={(e) =>
                  setEmergencyContact((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 8px 0' }}>Child Profiles</h4>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '13px' }}>
                    Add or edit each child that uses the KidSafe tracker.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNewChild}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: '1px solid #4A90E2',
                    background: 'white',
                    color: '#4A90E2',
                    cursor: 'pointer',
                  }}
                >
                  Add Child
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                {children.map((child) => (
                  <div
                    key={child.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '14px',
                      border:
                        child.id === selectedChildId ? '2px solid #4A90E2' : '1px solid #D1D9E6',
                      backgroundColor: child.id === selectedChildId ? '#EFF6FF' : '#F8FAFF',
                      cursor: 'pointer',
                      minWidth: '120px',
                    }}
                    onClick={() => handleSelectChild(child.id)}
                  >
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                      {child.name || 'Unnamed'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>
                      {child.age ? `${child.age} yrs` : 'Age missing'}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChild(child.id);
                      }}
                      style={{
                        marginTop: '8px',
                        padding: '6px 10px',
                        borderRadius: '10px',
                        border: '1px solid #F1F5F9',
                        background: '#FFF5F5',
                        color: '#DC2626',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div
                  style={{
                    width: '92px',
                    height: '92px',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    border: '1px solid #D1D9E6',
                    backgroundColor: '#F8FAFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {childDraft.photoPreview ? (
                    <img
                      src={childDraft.photoPreview}
                      alt="Child preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ color: '#6B7280', fontSize: '12px', textAlign: 'center' }}>
                      No photo yet
                    </span>
                  )}
                </div>
                <div style={{ flex: '1 1 240px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                    Upload Child Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleChildPhotoFile}
                    style={{ width: '100%' }}
                  />
                  {childDraft.photoPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      style={{
                        marginTop: '12px',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        background: 'white',
                        color: '#374151',
                        cursor: 'pointer',
                      }}
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
              <input
                style={inputStyle}
                placeholder="Child name"
                value={childDraft.name}
                onChange={(e) => setChildDraft((prev) => ({ ...prev, name: e.target.value }))}
              />
              <input
                style={inputStyle}
                placeholder="Child age"
                type="number"
                min="1"
                value={childDraft.age}
                onChange={(e) => setChildDraft((prev) => ({ ...prev, age: e.target.value }))}
              />
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                {CHILD_AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setChildDraft((prev) => ({ ...prev, avatar: emoji }))}
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      border:
                        childDraft.avatar === emoji ? '1px solid #4A90E2' : '1px solid #D1D9E6',
                      background: childDraft.avatar === emoji ? '#E7F3FF' : 'white',
                      cursor: 'pointer',
                      fontSize: '18px',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <h4 style={{ margin: '0 0 12px 0' }}>App Theme</h4>
              <select
                style={inputStyle}
                value={appTheme}
                onChange={(e) => setAppTheme(e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <h4 style={{ margin: '0 0 12px 0' }}>SOS Ringtone</h4>
              <select
                style={inputStyle}
                value={sosRingtone}
                onChange={(e) => setSosRingtone(e.target.value)}
              >
                {SOS_RINGTONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6B7280' }}>
                When an SOS is triggered, this ringtone will play inside the app.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '14px 22px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: '#4A90E2',
                color: 'white',
                fontWeight: '700',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save General Settings'}
            </button>
          </form>
        )}
      </section>

      <section style={sectionStyle}>
        <div style={sectionHeaderStyle} onClick={() => toggleSection('about')}>
          <div>
            <h3 style={{ margin: 0 }}>About Us</h3>
            <p style={{ color: '#6B7280', margin: '4px 0 0 0' }}>Meet the team behind KidSafe.</p>
          </div>
          <div style={{ fontSize: '20px' }}>{openSections.about ? '−' : '+'}</div>
        </div>

        {openSections.about && (
          <div style={{ display: 'grid', gap: '14px' }}>
            {DEFAULT_DEV_TEAM.map((member) => (
              <div
                key={member.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  backgroundColor: '#F8FAFF',
                  borderRadius: '18px',
                  padding: '18px',
                }}
              >
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    backgroundColor: '#E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    fontWeight: '700',
                    color: '#1F2937',
                    flexShrink: 0,
                  }}
                >
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    member.avatar
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#111827' }}>
                    {member.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280', margin: '6px 0 8px 0' }}>
                    {member.role}
                  </div>
                  <div style={{ fontSize: '14px', color: '#1D4ED8' }}>
                    <a
                      href={`mailto:${member.contact}`}
                      style={{ color: '#1D4ED8', textDecoration: 'none' }}
                    >
                      {member.contact}
                    </a>
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                    {member.phone}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {message && (
        <div style={{ marginTop: '10px', color: '#055160', fontWeight: 600 }}>{message}</div>
      )}
    </div>
  );
};

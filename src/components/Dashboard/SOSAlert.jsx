import React, { useEffect, useRef } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

const RINGTONE_PATTERNS = {
  classic: [
    { freq: 880, duration: 0.25 },
    { freq: 0, duration: 0.1 },
    { freq: 880, duration: 0.25 },
    { freq: 0, duration: 0.1 },
    { freq: 880, duration: 0.5 },
  ],
  alarm: [
    { freq: 1200, duration: 0.18 },
    { freq: 0, duration: 0.05 },
    { freq: 1200, duration: 0.18 },
    { freq: 0, duration: 0.05 },
    { freq: 1200, duration: 0.18 },
  ],
  soft: [
    { freq: 660, duration: 0.35 },
    { freq: 0, duration: 0.08 },
    { freq: 740, duration: 0.35 },
    { freq: 0, duration: 0.08 },
    { freq: 660, duration: 0.55 },
  ],
};

export const SOSAlert = ({ childName, childId, ringtone = 'classic', onDismiss }) => {
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainRef = useRef(null);
  const stopTimeoutRef = useRef(null);

  const stopRingtone = () => {
    if (stopTimeoutRef.current) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch (err) {
        // silence stop errors
      }
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    if (gainRef.current) {
      gainRef.current.disconnect();
      gainRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  useEffect(() => {
    const pattern = RINGTONE_PATTERNS[ringtone] || RINGTONE_PATTERNS.classic;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return undefined;

    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0, audioContext.currentTime);

    oscillatorRef.current = oscillator;
    gainRef.current = gain;
    audioContextRef.current = audioContext;

    let currentTime = audioContext.currentTime;
    pattern.forEach(({ freq, duration }) => {
      if (freq > 0) {
        oscillator.frequency.setValueAtTime(freq, currentTime);
        gain.gain.setValueAtTime(0.22, currentTime + 0.02);
        gain.gain.setValueAtTime(0.22, currentTime + duration - 0.02);
        gain.gain.setValueAtTime(0, currentTime + duration);
      } else {
        gain.gain.setValueAtTime(0, currentTime);
      }
      currentTime += duration;
    });

    oscillator.start(audioContext.currentTime);
    oscillator.stop(currentTime + 0.05);

    stopTimeoutRef.current = window.setTimeout(() => {
      stopRingtone();
    }, (currentTime - audioContext.currentTime + 0.2) * 1000);

    return () => {
      stopRingtone();
    };
  }, [ringtone]);

  const handleDismiss = async () => {
    try {
      if (db) {
        await updateDoc(doc(db, 'tracker', childId), { sos_active: false });
      }
      stopRingtone();
      onDismiss();
    } catch (error) {
      console.error('Error dismissing SOS:', error);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(255, 59, 48, 0.98)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>🚨 SOS ALERT</h1>
      <p style={{ fontSize: '18px', marginBottom: '30px' }}>
        {childName} pressed the emergency panic button!
      </p>
      <button
        onClick={handleDismiss}
        style={{
          padding: '15px 40px',
          borderRadius: '30px',
          border: 'none',
          background: 'white',
          color: '#FF3B30',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '16px',
          boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
        }}
      >
        DISMISS SYSTEM EMERGENCY
      </button>
    </div>
  );
};

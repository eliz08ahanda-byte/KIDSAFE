import React, { useState, useEffect, lazy, Suspense } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import './App.css';

const AuthScreen = lazy(() => import('./components/Auth').then((mod) => ({ default: mod.AuthScreen })));
const ChildSetupScreen = lazy(() => import('./components/Auth').then((mod) => ({ default: mod.ChildSetupScreen })));
const TrackerDashboard = lazy(() => import('./components/Dashboard').then((mod) => ({ default: mod.TrackerDashboard })));

/**
 * Main KidSafe Application Component
 */
function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [parentConfig, setParentConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  // Hidden state switch to prevent ESP32 updates from kicking the user out
  const [localSetupOverride, setLocalSetupOverride] = useState(false);

  /**
   * Listen to authentication state changes
   */
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);

        // Listen to parent config
        const unsubscribeConfig = onSnapshot(
          doc(db, 'parents', user.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              
              // Pass the auth UID down into the parent config structure 
              // so TrackerDashboard knows exactly where to listen!
              setParentConfig({ ...data, uid: user.uid });
              
              // If local override is true, stay in dashboard regardless of fluctuating fields
              setSetupComplete(localSetupOverride || data.setupComplete || false);
            } else {
              setSetupComplete(localSetupOverride ? true : false);
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching parent config:', error);
            setLoading(false);
          }
        );

        return unsubscribeConfig;
      } else {
        setCurrentUser(null);
        setParentConfig(null);
        setSetupComplete(false);
        setLocalSetupOverride(false);
        setLoading(false);
      }
    });

    return unsubscribeAuth;
  }, [localSetupOverride]);

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setParentConfig(null);
      setSetupComplete(false);
      setLocalSetupOverride(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  /**
   * Handle auth success (login/signup)
   */
  const handleAuthSuccess = () => {
    // Parent config will be fetched from Firestore listener
  };

  /**
   * Handle setup completion
   */
  const handleSetupComplete = () => {
    setLocalSetupOverride(true);
    setSetupComplete(true);
  };

  const fallbackStyles = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#F0F4FF',
    fontFamily: 'Arial, sans-serif',
  };

  // Loading state
  if (loading) {
    return (
      <div style={fallbackStyles}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🛡️</div>
          <h2 style={{ color: '#4A90E2', marginBottom: '10px' }}>KidSafe</h2>
          <p style={{ color: '#888' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated state - Show auth screen
  if (!currentUser) {
    return (
      <Suspense fallback={<div style={fallbackStyles}><p>Loading authentication screen...</p></div>}>
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </Suspense>
    );
  }

  // Authenticated but setup incomplete - Show setup screen
  if (!setupComplete && !localSetupOverride) {
    return (
      <Suspense fallback={<div style={fallbackStyles}><p>Loading setup screen...</p></div>}>
        <ChildSetupScreen onComplete={handleSetupComplete} />
      </Suspense>
    );
  }

  // Authenticated and setup complete - Show dashboard
  return (
    <Suspense fallback={<div style={fallbackStyles}><p>Loading dashboard...</p></div>}>
      <TrackerDashboard parentConfig={parentConfig} onLogout={handleLogout} />
    </Suspense>
  );
}

export default App;
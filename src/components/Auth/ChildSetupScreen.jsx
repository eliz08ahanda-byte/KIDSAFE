import React, { useState } from 'react';
import { sanitizeInput, validateForm, validators, getErrorMessage } from '../../utils/validators';
import { setDoc, doc } from 'firebase/firestore'; 
import { auth, db, storage } from '../../firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { CHILD_AVATARS } from '../../utils/constants';

const childSetupSchema = {
  childName: {
    required: true,
    validate: (v) => validators.name(v),
    errorMessage: getErrorMessage('Child name', 'name'),
  },
  childAge: {
    required: true,
    validate: (v) => validators.age(v, true),
    errorMessage: getErrorMessage('Child age', 'age'),
  },
};

export const ChildSetupScreen = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    childName: '',
    childAge: '',
    childAvatar: CHILD_AVATARS[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: sanitizeInput(value) }));
  };

  const handleFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFile(f);
    try {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } catch (err) {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = validateForm(formData, childSetupSchema);
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors)[0]);
      return;
    }

    if (!auth.currentUser || !db) {
      setError('Error: Firebase not properly initialized');
      return;
    }

    setLoading(true);

    try {
      let photoUrl = null;
      if (file && storage) {
        const path = `parents/${auth.currentUser.uid}/child_${Date.now()}`;
        const sRef = storageRef(storage, path);
        const uploadTask = uploadBytesResumable(sRef, file);
        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            null,
            (err) => reject(err),
            () => resolve()
          );
        });
        photoUrl = await getDownloadURL(uploadTask.snapshot.ref);
      }

      const generatedChildId = `child_${Date.now()}`;

      // THE ULTIMATE FIX: Saves both schemas to satisfy router checks while preserving hardware tracks
      await setDoc(doc(db, 'parents', auth.currentUser.uid), {
        // 1. Nested array object format (Satisfies top-level App.jsx layout navigations)
        children: [
          {
            id: generatedChildId,
            name: formData.childName,
            age: parseInt(formData.childAge),
            avatar: formData.childAvatar,
            photoUrl: photoUrl,
          },
        ],
        currentChildId: generatedChildId,
        
        // 2. Flat layout parameters (Ensures fields merge cleanly with your ESP32 streams)
        childName: formData.childName,
        childAge: parseInt(formData.childAge),
        childAvatar: formData.childAvatar,
        childPhotoUrl: photoUrl,
        setupComplete: true, 
      }, { merge: true }); // Crucial option: holds tightly to existing latitude/longitude points!
      
      onComplete();
    } catch (err) {
      setError('Error saving profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F4FF',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '40px 30px',
          borderRadius: '24px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
          width: '100%',
          maxWidth: '380px',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            margin: '0 0 5px 0',
            color: '#2C3E50',
            fontSize: '22px',
            fontWeight: 'bold',
          }}
        >
          Child Profile Setup
        </h2>
        <p style={{ margin: '0 0 25px 0', color: '#7F8C8D', fontSize: '14px' }}>
          Enter your child's tracking profile parameters
        </p>

        {error && (
          <div
            style={{
              backgroundColor: '#FFEBEE',
              color: '#D32F2F',
              padding: '12px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '20px',
              textAlign: 'center',
              border: '1px solid #FFCDD2',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ margin: '20px 0' }}>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#34495E',
                display: 'block',
                marginBottom: '8px',
                textAlign: 'left',
              }}
            >
              Select Profile Picture Avatar or Upload Real Photo
            </label>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                fontSize: '32px',
                background: '#F8F9FA',
                padding: '10px',
                borderRadius: '12px',
                border: '1px solid #BDC3C7',
              }}
            >
              {CHILD_AVATARS.map((emoji) => (
                <span
                  key={emoji}
                  onClick={() => setFormData((prev) => ({ ...prev, childAvatar: emoji }))}
                  style={{
                    cursor: 'pointer',
                    padding: '5px',
                    borderRadius: '8px',
                    background: formData.childAvatar === emoji ? '#4A90E2' : 'transparent',
                    transform: formData.childAvatar === emoji ? 'scale(1.15)' : 'none',
                    transition: 'all 0.1s',
                  }}
                >
                  {emoji}
                </span>
              ))}
            </div>
              <div style={{ marginTop: '12px', textAlign: 'left' }}>
                <input type="file" accept="image/*" onChange={handleFile} />
                {preview && (
                  <div style={{ marginTop: '10px' }}>
                    <img src={preview} alt="preview" style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
          </div>

          <div style={{ textAlign: 'left', marginBottom: '15px' }}>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#34495E',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Child's Name
            </label>
            <input
              type="text"
              name="childName"
              placeholder="Enter name"
              value={formData.childName}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid #BDC3C7',
                boxSizing: 'border-box',
                fontSize: '14px',
                backgroundColor: '#FFFFFF',
                color: '#000000',
              }}
            />
          </div>

          <div style={{ textAlign: 'left', marginBottom: '25px' }}>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#34495E',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Child's Age
            </label>
            <input
              type="number"
              name="childAge"
              placeholder="Enter age"
              value={formData.childAge}
              onChange={handleChange}
              min="1"
              max="18"
              required
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid #BDC3C7',
                boxSizing: 'border-box',
                fontSize: '14px',
                backgroundColor: '#FFFFFF',
                color: '#000000',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: loading ? '#9DBCE0' : '#4A90E2',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'SAVING PROFILE...' : 'COMPLETE CONFIGURATION'}
          </button>
        </form>
      </div>
    </div>
  );
};
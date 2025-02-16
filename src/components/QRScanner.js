import React, { useState, useCallback, useRef } from 'react';
import { Html5Qrcode } from "html5-qrcode";
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import './QRScanner.css';

const QRScanner = ({ eventId, onScan, onClose }) => {
  const [scanError, setError] = useState(null);
  const supabase = useSupabaseClient();
  const [scanData, setScanData] = useState(null);
  const scannerRef = useRef(null);

  const handleScan = useCallback(async (data) => {
    if (!scannerRef.current) return;
    if (data) {
      const scannedText = data;
      console.log('Scanned text:', scannedText);

      try {
        let userData = null;

        if (/^\d+$/.test(scannedText)) {
          // Handle barcode scanning
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('school_id', scannedText)
            .single();

          if (profileError) {
            throw new Error(`Student ID ${scannedText} not found`);
          }
          userData = profileData;
        } else {
          // Check if the scanned text is an email
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', scannedText)
            .single();

          if (profileError) {
            throw new Error(`User with email ${scannedText} not found`);
          }
          userData = profileData;
        }

        console.log('Final user data:', userData);

        if (!userData || (!userData.id && !userData.school_id)) {
          throw new Error('Invalid scan format - missing required data');
        }

        setError(null);
        setScanData(userData);
      } catch (err) {
        console.error('Scan error:', err);
        setError('Scan error: ' + (err.message || 'Invalid format'));
      }
    }
  }, [supabase]);

  // Cleanup function to properly stop scanner
  const cleanupScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current = null;
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  const confirmAttendance = async () => {
    try {
      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .insert({
          event_id: eventId,
          user_id: scanData.id,
          status: 'present',
          timestamp: new Date().toISOString()
        });

      if (attendanceError) {
        // Check if error is due to duplicate entry
        if (attendanceError.code === '23505') {
          setError('Attendance already recorded for this event');
          return;
        }
        console.error('Supabase error:', attendanceError);
        throw new Error(attendanceError.message || 'Failed to record attendance');
      }

      onScan && onScan({ ...scanData });
      setScanData(null);
    } catch (err) {
      setError('Error recording attendance: ' + (err.message || 'Unknown error occurred'));
    }
  };

  const initializeScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current = null;
      }
      const scanner = new Html5Qrcode("reader");
      const devices = await Html5Qrcode.getCameras();

      if (!devices || devices.length === 0) {
        throw new Error('No cameras found');
      }

      // Try to find back camera
      let cameraId = devices[0].id;

      // On mobile devices, try to use the back camera
      if (devices.length > 1) {
        const backCamera = devices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear')
        );
        if (backCamera) {
          cameraId = backCamera.id;
        }
      }

      scannerRef.current = scanner;

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          formatsToSupport: [
            0, // QR Code
            7, // Code 128 (barcode)
            3  // EAN-13
          ],
        },
        (decodedText) => handleScan(decodedText),
        (errorMessage) => { /* Ignore errors */ }
      );
    } catch (err) {
      console.warn('Scanner initialization:', err);
      setError(err.message || 'Failed to start scanner');
    }
  }, [handleScan]);

  React.useEffect(() => {
    if (document.getElementById('reader')) {
      initializeScanner();
    }
    return () => {
      cleanupScanner();
    };
  }, [initializeScanner]);

  return (
    <div className="qr-scanner">
      <div id="reader"></div>
      <p className="scanner-instruction">Position the QR code or barcode within the frame</p>

      {scanError && (
        <div className="error-message">
          {scanError}
        </div>
      )}

      {scanData && (
        <div className="confirmation-dialog">
          <h3>Confirm Attendance</h3>
          <div className="user-details">
            <p><strong>Name:</strong> {`${scanData.first_name} ${
              scanData.middle_name ? scanData.middle_name + ' ' : ''
            }${scanData.last_name}`}</p>
            <p><strong>Student ID:</strong> {scanData.school_id || 'N/A'}</p>
            <p><strong>Year Level:</strong> {scanData.year_level || 'N/A'}</p>
            <p><strong>Email:</strong> {scanData.email}</p>
            <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
          </div>
          <div className="confirmation-buttons">
            <button onClick={confirmAttendance} className="confirm-btn">
              Confirm
            </button>
            <button onClick={() => setScanData(null)} className="cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      )}

      <button className="close-scanner" onClick={() => {
        cleanupScanner().then(() => {
          // Clear any existing data
          setScanData(null);
          setError(null);
          // Only call onClose after cleanup is complete
          onClose && onClose();
        });
      }}>
        <span>×</span>
      </button>
    </div>
  );
};

export default QRScanner;

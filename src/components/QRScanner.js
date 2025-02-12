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
      if (scannerRef.current?.isScanning) await scannerRef.current.stop();
      setError(null);
      try {
        // Stop the scanner before processing
        if (scannerRef.current) {
          await scannerRef.current.stop();
        }

        const userData = JSON.parse(data.text);
        setScanData(userData);
      } catch (err) {
        setError('Error recording attendance: ' + err.message);
      }
    }
  }, []);

  const confirmAttendance = async () => {
    try {
      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .upsert({
          event_id: eventId,
          user_id: scanData.id,
          status: 'present',
          timestamp: new Date().toISOString()
        });

      if (attendanceError) throw attendanceError;
      onScan && onScan(scanData);
      setScanData(null);
    } catch (err) {
      setError('Error recording attendance: ' + err.message);
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

      const cameraId = devices[0].id;
      scannerRef.current = scanner;

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => handleScan({ text: decodedText }),
        () => {}
      );
    } catch (err) {
      console.error('Scanner error:', err);
      setError(err.message || 'Failed to start scanner');
    }
  }, [handleScan]);

  React.useEffect(() => {
    if (document.getElementById('reader')) {
      initializeScanner();
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop()
          .catch(err => console.error('Cleanup error:', err));
      }
    };
  }, [initializeScanner]);

  return (
    <div className="qr-scanner">
      <div id="reader"></div>
      
      {scanError && (
        <div className="error-message">
          {scanError}
        </div>
      )}
      
      {scanData && (
        <div className="confirmation-dialog">
          <h3>Confirm Attendance</h3>
          <div className="user-details">
            <p><strong>Email:</strong> {scanData.email}</p>
            <p><strong>ID:</strong> {scanData.id}</p>
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
        if (scannerRef.current?.isScanning) {
          try {
            scannerRef.current.stop();
          } catch (err) {
            console.log('Error stopping scanner:', err);
          }
        }
        onClose && onClose();
      }}>
        <span>×</span>
      </button>
    </div>
  );
};

export default QRScanner;

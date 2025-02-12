import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import './QRScanner.css';

let scanner;
const QRScanner = ({ eventId, onScan, onClose }) => {
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const supabase = useSupabaseClient();
  const [scanData, setScanData] = useState(null);

  const handleScan = async (data) => {
    if (data) {
      setError(null);
      try {
        // Stop the scanner before processing
        if (window.scanner) {
          window.scanner.clear().catch(err => {
            console.error('Error stopping scanner:', err);
          });
        }

        const userData = JSON.parse(data.text);
        setScanData(userData);
      } catch (err) {
        setError('Error recording attendance: ' + err.message);
      }
    }
  };

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

  const startScanner = async () => {
    try {
      const scanner = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1
      });

      scanner.render(success, error);

      function success(result) {
        handleScan({ text: result });
        window.scanner.clear();
      }

      function error(err) {
        console.error(err);
      }

      setHasPermission(true);
      window.scanner = scanner;

    } catch (err) {
      console.error('Scanner error:', err);
      setError(err.message);
      setHasPermission(false);
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      if (window.scanner) {
        window.scanner.clear().catch(err => console.error(err));
      }
    };
  }, [startScanner]);

  return (
    <div className="qr-scanner">
      <div id="reader"></div>
      
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
        if (window.scanner) window.scanner.clear();
        onClose && onClose();
      }}>
        <span>×</span>
      </button>
    </div>
  );
};

export default QRScanner;

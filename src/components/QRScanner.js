import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { useSupabaseClient } from '@supabase/auth-helpers-react';

let html5QrCode;
const QRScanner = ({ eventId, onScan, onClose }) => {
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const supabase = useSupabaseClient();

  const handleScan = async (data) => {
    if (data) {
      setError(null);
      try {
        const userData = JSON.parse(data.text);
        
        const { error: attendanceError } = await supabase
          .from('attendance_records')
          .upsert({
            event_id: eventId,
            user_id: userData.id,
            status: 'present',
            timestamp: new Date().toISOString()
          });

        if (attendanceError) throw attendanceError;
        
        onScan && onScan(userData);
      } catch (err) {
        setError('Error recording attendance: ' + err.message);
      }
    }
  };

const startScanner = async () => {
    try {
      const scanner = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      });

      scanner.render(success, error);

      function success(result) {
        handleScan({ text: result });
        scanner.clear();
      }

      function error(err) {
        console.error(err);
      }

      setHasPermission(true);
      html5QrCode = scanner;

    } catch (err) {
      console.error('Scanner error:', err);
      setError(err.message);
      setHasPermission(false);
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      if (html5QrCode) {
        html5QrCode.clear().catch(err => console.error(err));
      }
    };
  }, []);

  return (
    <div className="qr-scanner">
      <div id="reader"></div>
      <button onClick={() => onClose && onClose()} style={{position: 'absolute', top: 10, right: 10}}>Close</button>
      {hasPermission === false ? (
        <div className="scanner-error">
          <p>{error}</p>
          <button onClick={() => {
            setHasPermission(null);
            startScanner();
          }}>
            Retry Camera Access
          </button>
        </div>
      ) : hasPermission === null ? (
        <div className="scanner-loading">
          <p>Requesting camera access...</p>
        </div>
      ) : null}
    </div>
  );
};

export default QRScanner;

// UserQRCode.js
import React from 'react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import wizardLogo from './images/wizard-logo.png';

const UserQRCode = ({ userId, userEmail }) => {
  const qrData = JSON.stringify({
    id: userId,
    email: userEmail,
    timestamp: new Date().toISOString(),
  });

  return (
    <div className="qr-code-container" style={{ position: 'relative', display: 'inline-block' }}>
      <QRCode
        value={qrData}
        size={300}
        level="H"
        includeMargin={true}
        bgColor="#ffffff"
        fgColor="#000080" // Navy blue foreground color
        imageSettings={{
          src: wizardLogo,
          excavate: true,
          width: 80, // Adjust size as needed
          height: 80,
        }}
      />

      {/* Four Decorative Squares */}
      <div className="decorative-squares">
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
          <div key={pos} className={`square ${pos}`} />
        ))}
      </div>

      <h3 style={{ color: '#001f3f' }}>College of Information Technology Attendance System</h3>
      <p style={{ color: '#001f3f' }}>Scan this code to mark attendance</p>
    </div>
  );
};

export default UserQRCode;

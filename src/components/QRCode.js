import React from 'react';
import { QRCodeSVG as QRCode } from 'qrcode.react';

const UserQRCode = ({ userId, userEmail }) => {
  const qrData = JSON.stringify({
    id: userId,
    email: userEmail,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="qr-code-container">
      <QRCode
        value={qrData}
        size={256}
        level="H"
        includeMargin={true}
      />
      <p>Scan this code to mark attendance</p>
    </div>
  );
};

export default UserQRCode;

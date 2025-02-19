import React from 'react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import wizardLogo from './images/wizard-logo.png';
import './QRCode.css';

const downloadQRCode = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');

  // Draw QR code
  const svg = document.getElementById('qr-code');
  const svgData = new XMLSerializer().serializeToString(svg);
  const qrImg = new Image();

  qrImg.onload = () => {
    ctx.drawImage(qrImg, 0, 0, 300, 300);

    // Draw wizard logo
    const logoImg = new Image();
    logoImg.onload = () => {
      // Calculate center position
      const logoSize = 80;
      const x = (300 - logoSize) / 2;
      const y = (300 - logoSize) / 2;
      
      ctx.drawImage(logoImg, x, y, logoSize, logoSize);

      // Download the combined image
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-code-${Date.now()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    logoImg.src = wizardLogo;
  };
  qrImg.src = 'data:image/svg+xml;base64,' + btoa(svgData);
};

const UserQRCode = ({ userId, userEmail }) => {
  // Just use the email as the QR code data
  const qrData = userEmail;

  return (
    <div className="qr-code-container" style={{ position: 'relative', display: 'inline-block' }}>
      <QRCode
        id="qr-code"
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
      <button onClick={downloadQRCode} className="download-qr-button">
        Download QR Code
      </button>
    </div>
  );
};

export default UserQRCode;

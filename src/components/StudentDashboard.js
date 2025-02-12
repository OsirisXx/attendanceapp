import React from 'react';
import { useSessionContext, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';
import UserQRCode from './QRCode';

function StudentDashboard() {
  const { session } = useSessionContext();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const [attendanceHistory, setAttendanceHistory] = React.useState([]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/');
    }
  };

  React.useEffect(() => {
    const fetchAttendanceHistory = async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          events (
            title,
            date
          )
        `)
        .eq('user_id', session.user.id)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching attendance:', error);
      } else {
        setAttendanceHistory(data);
      }
    };

    fetchAttendanceHistory();
  }, [supabase, session.user.id]);

  return (
    <div className="student-dashboard">
      <div className="dashboard-content">
        <h1 className="dashboard-title">Student Dashboard</h1>
        <div className="dashboard-header">
          <p className="welcome-text">Welcome, {session?.user?.email}</p>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>

        <div className="qr-section">
          <h2>Your QR Code</h2>
          <UserQRCode userId={session.user.id} userEmail={session.user.email} />
        </div>

        <div className="attendance-history">
          <h2>Attendance History</h2>
          <div className="attendance-grid">
            {attendanceHistory.map((record) => (
              <div key={record.id} className="attendance-card">
                <h3>{record.events.title}</h3>
                <p>
                  <strong>Date:</strong> {new Date(record.events.date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Time:</strong> {new Date(record.timestamp).toLocaleTimeString()}
                </p>
                <span className={`status-badge status-${record.status.toLowerCase()}`}>
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;

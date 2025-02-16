import React, { useState } from 'react';
import { useSessionContext, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';
import UserQRCode from './QRCode';

function StudentDashboard() {
  const { session } = useSessionContext();
  const supabase = useSupabaseClient();
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();
  const [attendanceHistory, setAttendanceHistory] = React.useState([]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/');
    }
  };

  React.useEffect(() => {
    const fetchUserProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!error && data) {
        setUserProfile(data);
      }
    };

    fetchUserProfile();
  }, [session.user.id, supabase]);

  React.useEffect(() => {
    const fetchAttendanceHistory = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching events:', error);
        return;
      }

      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*, events!inner(*)')
        .eq('user_id', session.user.id);

      if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
        return;
      }

      // Create a map of attended events
      const attendedEvents = new Map(
        attendanceData.map(record => [record.event_id, record])
      );

      // Combine all events with attendance status
      const combinedHistory = data.map(event => {
        const attendanceRecord = attendedEvents.get(event.id);
        return {
          id: event.id,
          events: event,
          status: attendanceRecord ? attendanceRecord.status : 'Absent',
          timestamp: attendanceRecord ? attendanceRecord.timestamp : event.date,
        };
      });

      if (data) {
        setAttendanceHistory(combinedHistory);
      } else {
        setAttendanceHistory([]);
      }
    };

    fetchAttendanceHistory();
  }, [supabase, session.user.id]);

  return (
    <div className="student-dashboard">
      <div className="dashboard-content">
        <h1 className="dashboard-title">Student Dashboard</h1>
        <div className="dashboard-header">
          <p className="welcome-text">
            Welcome, {userProfile ? (
              `${userProfile.first_name} ${userProfile.middle_name || ''} ${userProfile.last_name}`
            ) : (
              session?.user?.email
            )}
          </p>
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
                <span className={`status-badge status-${record.status.toLowerCase().replace(' ', '-')}`}>
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

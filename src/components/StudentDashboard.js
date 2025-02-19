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
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    try {
      if (!error) {
        localStorage.clear();
        sessionStorage.clear();
        navigate('/');
      } else {
        console.error('Logout error:', error);
        navigate('/');
      }
    } catch (err) {
      console.error('Logout failed:', err);
      navigate('/');
    } finally {
      setIsLoading(false);
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
        .order('timestamp', { ascending: false });

      if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
        return;
      }

      // Create a map of attended events
      const attendedEvents = new Map(
        attendanceData.map(record => [record.event_id, record])
      );

      // Count attendees for each event
      const attendeeCounts = attendanceData.reduce((acc, record) => {
        acc[record.event_id] = (acc[record.event_id] || 0) + 1;
        return acc;
      }, {});

      // Combine all events with attendance status
      const combinedHistory = data.map(event => {
        const attendanceRecord = attendedEvents.get(event.id);
        const userAttendanceRecord = attendanceData.find(record => 
          record.event_id === event.id && record.user_id === session.user.id
        );
        return {
          id: event.id,
          events: event,
          attendeeCount: attendeeCounts[event.id] || 0,
          status: userAttendanceRecord ? userAttendanceRecord.status : 'Absent',
          timestamp: attendanceRecord ? attendanceRecord.timestamp : event.date,
        };
      });

      setAttendanceHistory(combinedHistory);
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
          <button onClick={handleLogout} className="logout-button" disabled={isLoading}>
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
                <div className="attendee-count">
                  <span>{record.attendeeCount} Attendees</span>
                </div>
                <h3>{record.events.title}</h3>
                <p className="event-description">{record.events.description}</p>
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

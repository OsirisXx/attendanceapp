import React from 'react';
import { useSessionContext, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';
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

  React.useEffect(() => {
    fetchAttendanceHistory();
  }, [fetchAttendanceHistory]);

  return (
    <div className="student-dashboard">
      <h1>Student Dashboard</h1>
      <div className="dashboard-header">
        <p>Welcome, {session?.user?.email}</p>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
      
      <UserQRCode userId={session.user.id} userEmail={session.user.email} />
      
      <div className="attendance-history">
        <h2>Attendance History</h2>
        {attendanceHistory.map((record) => (
          <div key={record.id} className="attendance-record">
            <h3>{record.events.title}</h3>
            <p>Date: {new Date(record.events.date).toLocaleDateString()}</p>
            <p>Status: {record.status}</p>
            <p>Time: {new Date(record.timestamp).toLocaleTimeString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentDashboard;

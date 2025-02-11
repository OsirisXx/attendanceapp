import React, { useCallback, useState } from 'react';
import { useSessionContext, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';
import QRScanner from './QRScanner';
import './AdminDashboard.css';

function AdminDashboard() {
  const { session } = useSessionContext();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const [events, setEvents] = React.useState([]);
  const [selectedEvent, setSelectedEvent] = React.useState(null);
  const [showScanner, setShowScanner] = React.useState(false);
  const [showAttendees, setShowAttendees] = React.useState(false);
  const [attendeesList, setAttendeesList] = React.useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut({
        scope: 'global',
        shouldClearSession: true
      });
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error('Logout error:', error);
      console.error(error);
      alert('Error during logout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data);
    }
  }, [supabase]);

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const { error } = await supabase
      .from('events')
      .insert({
        title: formData.get('title'),
        description: formData.get('description'),
        date: formData.get('date'),
        created_by: session.user.id
      });

    if (error) {
      console.error('Error creating event:', error);
    } else {
      fetchEvents();
      e.target.reset();
    }
  };

  const exportToCSV = async (eventId) => {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        users:user_id (email),
        events:event_id (title, date)
      `)
      .eq('event_id', eventId);

    if (error) {
      console.error('Error fetching attendance:', error);
      return;
    }

    const csvContent = [
      ['Email', 'Status', 'Timestamp'],
      ...data.map(record => [
        record.users.email,
        record.status,
        new Date(record.timestamp).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${eventId}.csv`;
    a.click();
  };

  const fetchAttendees = async (eventId) => {
    setIsLoading(true);
    try {
      console.log('Fetching attendees for event:', eventId);
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          id,
          status,
          timestamp,
          user_id,
          event_id
        `)
        .eq('event_id', eventId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately to ensure we get the data
      const userIds = data.map(record => record.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, school_id')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user profiles
      const profilesMap = profilesData.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      // Combine attendance records with profile data
      const attendeesWithProfiles = data.map(record => ({
        ...record,
        profiles: profilesMap[record.user_id] || {
          email: 'Unknown',
          first_name: 'Unknown',
          last_name: 'User'
        }
      }));

      setAttendeesList(attendeesWithProfiles);
      setShowAttendees(true);
    } catch (error) {
      console.error('Error fetching attendees:', error);
      alert(`Error fetching attendees: ${error.message}`);
    }
    setIsLoading(false);
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-content">
        <h1 className="admin-title">Admin Dashboard</h1>
        <div className="admin-header">
          <p className="welcome-text">Welcome, {session?.user?.email}</p>
          <button 
            onClick={handleLogout} 
            className="logout-button" 
            disabled={isLoading}
          >
            {isLoading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
        
        <div className="create-event">
          <h2>Create New Event</h2>
          <form onSubmit={createEvent}>
            <input 
              name="title" 
              type="text" 
              placeholder="Event Title" 
              required 
            />
            <input 
              name="description" 
              type="text" 
              placeholder="Description" 
            />
            <input 
              name="date" 
              type="datetime-local" 
              required 
            />
            <button type="submit">Create Event</button>
          </form>
        </div>

        <div className="events-list">
          <h2>Events</h2>
          <div className="events-grid">
            {events.map((event) => (
              <div key={event.id} className="event-card">
                <h3>{event.title}</h3>
                <p>{event.description}</p>
                <p>
                  <strong>Date:</strong>{' '}
                  {new Date(event.date).toLocaleString()}
                </p>
                <div className="event-actions">
                  <button 
                    className="btn btn-scan"
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowScanner(true);
                    }}
                  >
                    Scan Attendance
                  </button>
                  <button 
                    className="btn btn-list"
                    onClick={() => fetchAttendees(event.id)}
                  >
                    List of Attendees
                  </button>
                  <button 
                    className="btn btn-export"
                    onClick={() => exportToCSV(event.id)}
                  >
                    Export to CSV
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showScanner && selectedEvent && (
        <div className="scanner-modal">
          <div className="scanner-container">
            <button 
              className="close-scanner"
              onClick={() => setShowScanner(false)}
            >
              ×
            </button>
            <QRScanner 
              eventId={selectedEvent.id}
              onScan={() => { fetchEvents(); setShowScanner(false); }}
            />
          </div>
        </div>
      )}

      {showAttendees && (
        <div className="attendees-modal">
          <div className="attendees-container">
            <button 
              className="close-attendees"
              onClick={() => setShowAttendees(false)}
            >
              ×
            </button>
            <h2>List of Attendees</h2>
            <div className="attendees-list">
              {attendeesList.map((record) => (
                <div key={record.id} className="attendee-item" style={{ margin: '10px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
                  <div className="attendee-info">
                    <h3>{record.profiles.first_name} {record.profiles.last_name}</h3>
                    <p>Email: {record.profiles.email}</p>
                    <p>School ID: {record.profiles.school_id}</p>
                    <p>Time: {new Date(record.timestamp).toLocaleString()}</p>
                    <p>Status: {record.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

import React, { useCallback } from 'react';
import { useSessionContext, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';
import QRScanner from './QRScanner';

function AdminDashboard() {
  const { session } = useSessionContext();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const [events, setEvents] = React.useState([]);
  const [selectedEvent, setSelectedEvent] = React.useState(null);
  const [showScanner, setShowScanner] = React.useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/');
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

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <div className="dashboard-header">
        <p>Welcome, {session?.user?.email}</p>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
      
      <div className="create-event">
        <h2>Create New Event</h2>
        <form onSubmit={createEvent}>
          <input name="title" type="text" placeholder="Event Title" required />
          <input name="description" type="text" placeholder="Description" />
          <input name="date" type="datetime-local" required />
          <button type="submit">Create Event</button>
        </form>
      </div>

      <div className="events-list">
        <h2>Events</h2>
        {events.map((event) => (
          <div key={event.id} className="event-card">
            <h3>{event.title}</h3>
            <p>{event.description}</p>
            <p>Date: {new Date(event.date).toLocaleString()}</p>
            <button onClick={() => {
              setSelectedEvent(event);
              setShowScanner(true);
            }}>Scan Attendance</button>
            <button onClick={() => exportToCSV(event.id)}>
              Export to CSV
            </button>
          </div>
        ))}
      </div>

      {showScanner && selectedEvent && (
        <div className="scanner-modal" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1000
        }}>
          <QRScanner 
            eventId={selectedEvent.id}
            onScan={() => { fetchEvents(); setShowScanner(false); }}
          />
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

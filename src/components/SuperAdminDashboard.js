import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../config/supabase';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('users');
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchEvents();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role, school_id, year_level')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching profiles:', error);
    } else {
      setUsers(data);
    }
    setIsLoading(false);
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*');
    if (error) console.error('Error fetching events:', error);
    else setEvents(data);
  };

  const toggleEventStatus = async (eventId, currentStatus) => {
    const newStatus = currentStatus === 'on-going' ? 'finished' : 'on-going';
    const { error } = await supabase
      .from('events')
      .update({ status: newStatus })
      .eq('id', eventId);
    if (error) console.error('Error updating event status:', error);
    else fetchEvents();
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      // Handle null or undefined values
      if (!a[sortConfig.key] && !b[sortConfig.key]) return 0;
      if (!a[sortConfig.key]) return 1;
      if (!b[sortConfig.key]) return -1;
      
      // Convert values to strings for comparison, with fallback to empty string
      let aVal = String(a[sortConfig.key] || '');
      let bVal = String(b[sortConfig.key] || '');
      
      // Perform the actual comparison
      if (sortConfig.direction === 'asc') {
        return aVal.toString().localeCompare(bVal.toString());
      }
      return bVal.toString().localeCompare(aVal.toString());
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="super-admin-dashboard">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Super Admin</h2>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={activeSection === 'users' ? 'active' : ''} 
            onClick={() => setActiveSection('users')}
          >
            Users
          </button>
          <button 
            className={activeSection === 'events' ? 'active' : ''} 
            onClick={() => setActiveSection('events')}
          >
            Events
          </button>
        </nav>
        <button className="sign-out-btn" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      <div className="main-content">
        {activeSection === 'users' && (
          <div className="section">
            <h2>Users List</h2>
            <div className="users-container">
              <table>
                <thead>
                  <tr>
                    <th>
                      ID
                      {sortConfig.key === 'id' && (
                        <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th onClick={() => requestSort('first_name')} style={{cursor: 'pointer'}}>
                      Name
                      {sortConfig.key === 'first_name' && (
                        <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th onClick={() => requestSort('year_level')} style={{cursor: 'pointer'}}>
                      Year Level
                      {sortConfig.key === 'year_level' && (
                        <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th onClick={() => requestSort('email')} style={{cursor: 'pointer'}}>
                      Email
                      {sortConfig.key === 'email' && (
                        <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th onClick={() => requestSort('school_id')} style={{cursor: 'pointer'}}>
                      School ID
                      {sortConfig.key === 'school_id' && (
                        <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th onClick={() => requestSort('role')} style={{cursor: 'pointer'}}>
                      Role
                      {sortConfig.key === 'role' && (
                        <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" style={{textAlign: 'center'}}>Loading...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{textAlign: 'center'}}>No users found</td>
                    </tr>
                  ) : (
                  getSortedData(users).map((user, index) => (
                    <tr key={user.id}>
                      <td>{index + 1}</td>
                      <td>{`${user.first_name || ''} ${user.last_name || ''}`}</td>
                      <td>{user.year_level || 'N/A'}</td>
                      <td>{user.email}</td>
                      <td>{user.school_id || 'N/A'}</td>
                      <td>{user.role || 'student'}</td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'events' && (
          <div className="section">
            <h2>Events List</h2>
            <div className="events-container">
              <table>
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Description</th>
                    <th onClick={() => requestSort('date')} style={{cursor: 'pointer'}}>
                      Date & Time
                      {sortConfig.key === 'date' && (
                        <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr><td colSpan="5" style={{textAlign: 'center'}}>No events found</td></tr>
                  ) : (
                    getSortedData(events).map(event => (
                      <tr key={event.id}>
                        <td>{event.title}</td>
                        <td>{event.description}</td>
                        <td>{new Date(event.date).toLocaleString()}</td>
                        <td style={{
                          color: event.status === 'on-going' ? 'green' : 'red',
                          fontWeight: 'bold'
                        }}>
                          {event.status || 'on-going'}
                        </td>
                        <td>
                          <button
                            onClick={() => toggleEventStatus(event.id, event.status)}
                            className={`status-toggle ${event.status}`}
                            title={`Click to mark as ${event.status === 'on-going' ? 'finished' : 'on-going'}`}
                          >
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;

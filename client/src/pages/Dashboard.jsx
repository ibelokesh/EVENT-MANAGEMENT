import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import EventForm from '../components/EventForm';
import EventList from '../components/EventList';
import AttendeeList from '../components/AttendeeList';
import UserManager from '../components/UserManager';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const canManage = user.role !== 'attendee';

  const [tab, setTab] = useState('all'); // 'all' | 'mine'
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: '', category: '' });
  const [attendeeView, setAttendeeView] = useState(null); // { event, attendees }
  const [error, setError] = useState('');

  const loadEvents = useCallback(async () => {
    try {
      const url = tab === 'mine' ? '/events/mine/registered' : '/events';
      const params = {};
      if (tab === 'all') {
        if (filters.search) params.search = filters.search;
        if (filters.category) params.category = filters.category;
      }
      const { data } = await api.get(url, { params });
      setEvents(data);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [tab, filters]);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [isAdmin]);

  useEffect(() => { loadEvents(); }, [loadEvents]);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  const wrap = (fn) => async (...args) => {
    try { setError(''); await fn(...args); } catch (e) { setError(errMsg(e)); }
  };

  const createEvent = wrap(async (form) => {
    await api.post('/events', form);
    await loadEvents();
  });
  const register = wrap(async (id) => {
    await api.post(`/events/${id}/register`);
    await loadEvents();
  });
  const cancel = wrap(async (id) => {
    if (!confirm('Cancel your registration?')) return;
    await api.delete(`/events/${id}/register`);
    await loadEvents();
  });
  const changeStatus = wrap(async (id, status) => {
    await api.put(`/events/${id}`, { status });
    await loadEvents();
  });
  const deleteEvent = wrap(async (id) => {
    if (!confirm('Delete this event and all its registrations?')) return;
    await api.delete(`/events/${id}`);
    setAttendeeView(null);
    await loadEvents();
  });
  const showAttendees = wrap(async (event) => {
    const { data } = await api.get(`/events/${event._id}/attendees`);
    setAttendeeView({ event, attendees: data });
  });
  const changeRole = wrap(async (id, role) => {
    await api.patch(`/users/${id}/role`, { role });
    await loadUsers();
  });
  const deleteUser = wrap(async (id) => {
    if (!confirm('Delete this user?')) return;
    await api.delete(`/users/${id}`);
    await Promise.all([loadUsers(), loadEvents()]);
  });

  const upcoming = events.filter((e) => e.status === 'upcoming').length;
  const attending = events.filter((e) => e.isRegistered).length;
  const full = events.filter((e) => e.registeredCount >= e.capacity).length;

  return (
    <>
      <Navbar />
      <main className="container">
        {error && <p className="error">{error}</p>}

        <div className="stats">
          <div className="card"><b>{events.length}</b><span>Shown</span></div>
          <div className="card"><b>{upcoming}</b><span>Upcoming</span></div>
          <div className="card"><b>{attending}</b><span>Registered</span></div>
          <div className="card"><b>{full}</b><span>Sold out</span></div>
        </div>

        {canManage && <EventForm onSubmit={createEvent} />}

        <div className="row between">
          <div className="row">
            <button className={`btn ${tab === 'all' ? '' : 'secondary'}`} onClick={() => setTab('all')}>Browse events</button>
            <button className={`btn ${tab === 'mine' ? '' : 'secondary'}`} onClick={() => setTab('mine')}>My registrations</button>
          </div>
          {tab === 'all' && (
            <div className="row">
              <input placeholder="Search title..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
              <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All categories</option>
                <option value="conference">Conference</option>
                <option value="workshop">Workshop</option>
                <option value="concert">Concert</option>
                <option value="sports">Sports</option>
                <option value="meetup">Meetup</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}
        </div>

        <h3>{tab === 'mine' ? 'My registrations' : 'All events'}</h3>
        {attendeeView && (
          <AttendeeList event={attendeeView.event} attendees={attendeeView.attendees} onClose={() => setAttendeeView(null)} />
        )}
        <EventList
          events={events}
          onRegister={register}
          onCancel={cancel}
          onDelete={deleteEvent}
          onStatus={changeStatus}
          onAttendees={showAttendees}
        />

        {isAdmin && <UserManager users={users} onRole={changeRole} onDelete={deleteUser} />}
      </main>
    </>
  );
}

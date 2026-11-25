import { useAuth } from '../context/AuthContext';

export default function EventList({ events, onRegister, onCancel, onDelete, onStatus, onAttendees }) {
  const { user } = useAuth();

  if (!events.length) return <p className="muted">No events found.</p>;

  return (
    <div className="grid">
      {events.map((e) => {
        const seatsLeft = e.capacity - e.registeredCount;
        const isFull = seatsLeft <= 0;
        const canManage = user.role === 'admin' || (user.role === 'organizer' && e.createdBy?._id === user.id);
        const open = e.status === 'upcoming';

        return (
          <div className="card" key={e._id}>
            <div className="row between">
              <h4>{e.title}</h4>
              <span className={`badge c-${e.category}`}>{e.category}</span>
            </div>
            <p className="muted">{e.description || 'No description'}</p>
            <small>
              📍 {e.venue}<br />
              🗓 {new Date(e.date).toLocaleString()}<br />
              💰 {e.price > 0 ? `₹${e.price}` : 'Free'} | By {e.createdBy?.name || 'Unknown'}
            </small>
            <div className="row between" style={{ marginTop: 8 }}>
              <span className={`badge s-${e.status}`}>{e.status}</span>
              <span className="muted">{isFull ? 'Full' : `${seatsLeft} / ${e.capacity} seats left`}</span>
            </div>

            <div className="row between" style={{ marginTop: 10 }}>
              {e.isRegistered ? (
                <button className="btn secondary" onClick={() => onCancel(e._id)}>Cancel registration</button>
              ) : (
                <button className="btn" disabled={!open || isFull} onClick={() => onRegister(e._id)}>
                  {!open ? 'Closed' : isFull ? 'Full' : 'Register'}
                </button>
              )}
              {e.isRegistered && <span className="badge s-upcoming">✓ Registered</span>}
            </div>

            {canManage && (
              <div className="row between" style={{ marginTop: 10 }}>
                <select value={e.status} onChange={(ev) => onStatus(e._id, ev.target.value)}>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button className="btn secondary" onClick={() => onAttendees(e)}>Attendees</button>
                <button className="btn danger" onClick={() => onDelete(e._id)}>Delete</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AttendeeList({ event, attendees, onClose }) {
  return (
    <div className="card">
      <div className="row between">
        <h3>Attendees — {event.title} ({attendees.length}/{event.capacity})</h3>
        <button className="btn secondary" onClick={onClose}>Close</button>
      </div>
      {attendees.length === 0 ? (
        <p className="muted">No one has registered yet.</p>
      ) : (
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Registered on</th></tr></thead>
          <tbody>
            {attendees.map((a) => (
              <tr key={a._id}>
                <td>{a.user.name}</td>
                <td>{a.user.email}</td>
                <td>{new Date(a.registeredAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

import { useAuth } from '../context/AuthContext';

export default function UserManager({ users, onRole, onDelete }) {
  const { user: me } = useAuth();
  return (
    <div className="card">
      <h3>User management (admin)</h3>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <select value={u.role} disabled={u._id === me.id} onChange={(e) => onRole(u._id, e.target.value)}>
                  <option value="attendee">attendee</option>
                  <option value="organizer">organizer</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td>{u._id !== me.id && <button className="btn danger" onClick={() => onDelete(u._id)}>Delete</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

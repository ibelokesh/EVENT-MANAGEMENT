import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="navbar">
      <h1>EventHub</h1>
      <div>
        <span>{user.name}</span> <span className={`badge role-${user.role}`}>{user.role}</span>
        <button className="btn secondary" onClick={logout}>Logout</button>
      </div>
    </header>
  );
}

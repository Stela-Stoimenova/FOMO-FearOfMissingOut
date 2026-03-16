// Navbar — reads auth state from context to show the right links
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
    const { isLoggedIn, user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/"); // go to home after logout
    }

    return (
        <nav className="navbar">
            <NavLink to="/" className="navbar-brand">
                FOMO
            </NavLink>

            <div className="navbar-links">
                <NavLink to="/" end>Home</NavLink>
                <NavLink to="/discover">Discover</NavLink>

                {isLoggedIn ? (
                    // ── Logged-in links ────────────────────────────────────────────────
                    <>
                        <NavLink to="/dashboard">Dashboard</NavLink>

                        {/* Role-specific quick links */}
                        {user.role === "DANCER" && (
                            <NavLink to="/my-tickets">My Tickets</NavLink>
                        )}
                        {(user.role === "STUDIO" || user.role === "AGENCY") && (
                            <NavLink to="/create-event">+ Event</NavLink>
                        )}

                        {/* User info + logout */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <NavLink to="/profile" className="navbar-user" style={{ cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: 0, border: 'none' }}>
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-light)' }} />
                                ) : (
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold', border: '1px solid var(--border-light)' }}>
                                        {(user.name || user.email).charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.name || user.email.split('@')[0]}</span>
                                    <span className="role-badge" style={{ fontSize: '0.65rem' }}>{user.role}</span>
                                </span>
                            </NavLink>
                            <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }}></div>
                            <button className="navbar-logout" onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    </>
                ) : (
                    // ── Guest links ────────────────────────────────────────────────────
                    <>
                        <NavLink to="/login">Login</NavLink>
                        <NavLink to="/register" className="navbar-register">Register</NavLink>
                    </>
                )}
            </div>
        </nav>
    );
}

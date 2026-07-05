// Navbar — reads auth state from context to show the right links
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";

export default function Navbar() {
    const { isLoggedIn, user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    function handleLogout() {
        logout();
        setMenuOpen(false);
        navigate("/");
    }

    function closeMenu() {
        setMenuOpen(false);
    }

    return (
        <nav className="navbar">
            <NavLink to="/" className="navbar-brand" onClick={closeMenu}>
                FOMO
            </NavLink>

            {/* Hamburger — only visible on mobile */}
            <button
                className="navbar-hamburger"
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Toggle menu"
            >
                <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
                <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
                <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
            </button>

            <div className={`navbar-links ${menuOpen ? "navbar-links--open" : ""}`}>
                <NavLink to="/" end onClick={closeMenu}>Home</NavLink>
                <NavLink to="/discover" onClick={closeMenu}>Discover</NavLink>

                {isLoggedIn ? (
                    <>
                        <NavLink to="/dashboard" onClick={closeMenu}>Dashboard</NavLink>
                        <NavLink to="/messages" onClick={closeMenu}>Messages</NavLink>

                        {user.role === "DANCER" && (
                            <NavLink to="/my-tickets" onClick={closeMenu}>My Tickets</NavLink>
                        )}
                        {(user.role === "STUDIO" || user.role === "AGENCY") && (
                            <NavLink to="/create-event" onClick={closeMenu}>+ Event</NavLink>
                        )}

                        <NotificationBell />

                        <div className="navbar-user-block">
                            <NavLink to="/profile" className="navbar-user" onClick={closeMenu} style={{ cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: 0, border: 'none' }}>
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
                            <div className="navbar-divider" />
                            <button className="navbar-logout" onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <NavLink to="/login" onClick={closeMenu}>Login</NavLink>
                        <NavLink to="/register" className="navbar-register" onClick={closeMenu}>Register</NavLink>
                    </>
                )}
            </div>
        </nav>
    );
}

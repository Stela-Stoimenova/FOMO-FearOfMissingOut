import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";

export default function Navbar() {
    const { isLoggedIn, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    // Close menu whenever route changes
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    function handleLogout() {
        logout();
        navigate("/");
    }

    const initials = user ? (user.name || user.email || "?").charAt(0).toUpperCase() : "?";

    return (
        <>
            <nav className="navbar">
                <NavLink to="/" className="navbar-brand">FOMO</NavLink>

                {/* Desktop links */}
                <div className="navbar-desktop">
                    <NavLink to="/" end className="nav-link">Home</NavLink>
                    <NavLink to="/discover" className="nav-link">Discover</NavLink>

                    {isLoggedIn && (
                        <>
                            <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
                            <NavLink to="/messages" className="nav-link">Messages</NavLink>
                            {user.role === "DANCER" && <NavLink to="/my-tickets" className="nav-link">My Tickets</NavLink>}
                            {(user.role === "STUDIO" || user.role === "AGENCY") && (
                                <NavLink to="/create-event" className="nav-link nav-link--cta">+ Event</NavLink>
                            )}
                        </>
                    )}
                </div>

                {/* Desktop right block */}
                <div className="navbar-right">
                    {isLoggedIn ? (
                        <>
                            <NotificationBell />
                            <NavLink to="/profile" className="navbar-avatar-link">
                                <div className="navbar-avatar">
                                    {user.avatarUrl
                                        ? <img src={user.avatarUrl} alt="avatar" referrerPolicy="no-referrer" onError={e => { e.target.style.display = "none"; }} />
                                        : <span>{initials}</span>}
                                </div>
                                <div className="navbar-user-info">
                                    <span className="navbar-user-name">{user.name || user.email.split("@")[0]}</span>
                                    <span className="role-badge">{user.role}</span>
                                </div>
                            </NavLink>
                            <button className="navbar-logout-desktop" onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" className="nav-link">Login</NavLink>
                            <NavLink to="/register" className="btn-primary navbar-register-btn">Register</NavLink>
                        </>
                    )}
                </div>

                {/* Hamburger — mobile only */}
                <button
                    className={`navbar-hamburger ${menuOpen ? "is-open" : ""}`}
                    onClick={() => setMenuOpen(o => !o)}
                    aria-label="Toggle menu"
                >
                    <span />
                    <span />
                    <span />
                </button>
            </nav>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="mobile-menu-backdrop" onClick={() => setMenuOpen(false)}>
                    <div className="mobile-menu" onClick={e => e.stopPropagation()}>

                        {/* User card */}
                        {isLoggedIn && (
                            <NavLink to="/profile" className="mobile-user-card">
                                <div className="mobile-user-avatar">
                                    {user.avatarUrl
                                        ? <img src={user.avatarUrl} alt="avatar" referrerPolicy="no-referrer" onError={e => { e.target.style.display = "none"; }} />
                                        : <span>{initials}</span>}
                                </div>
                                <div className="mobile-user-info">
                                    <span className="mobile-user-name">{user.name || user.email.split("@")[0]}</span>
                                    <span className="role-badge">{user.role}</span>
                                </div>
                                <span className="mobile-user-chevron">→</span>
                            </NavLink>
                        )}

                        {/* Navigation links */}
                        <div className="mobile-nav-section">
                            <NavLink to="/" end className="mobile-nav-link">Home</NavLink>
                            <NavLink to="/discover" className="mobile-nav-link">Discover</NavLink>

                            {isLoggedIn && (
                                <>
                                    <NavLink to="/dashboard" className="mobile-nav-link">Dashboard</NavLink>
                                    <NavLink to="/messages" className="mobile-nav-link">Messages</NavLink>
                                    <NavLink to="/notifications" className="mobile-nav-link">Notifications</NavLink>
                                    {user.role === "DANCER" && (
                                        <NavLink to="/my-tickets" className="mobile-nav-link">My Tickets</NavLink>
                                    )}
                                    {(user.role === "STUDIO" || user.role === "AGENCY") && (
                                        <NavLink to="/create-event" className="mobile-nav-link mobile-nav-link--accent">
                                            + Create Event
                                        </NavLink>
                                    )}
                                </>
                            )}

                            {!isLoggedIn && (
                                <>
                                    <NavLink to="/login" className="mobile-nav-link">Login</NavLink>
                                    <NavLink to="/register" className="mobile-nav-link mobile-nav-link--accent">Register</NavLink>
                                </>
                            )}
                        </div>

                        {/* Logout */}
                        {isLoggedIn && (
                            <div className="mobile-menu-footer">
                                <button className="mobile-logout-btn" onClick={handleLogout}>
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

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
                        <span className="navbar-user">
                            {user.email}
                            <span className="role-badge">{user.role}</span>
                        </span>
                        <button className="navbar-logout" onClick={handleLogout}>
                            Logout
                        </button>
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

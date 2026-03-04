// Navbar — shows at the top of every page
// Uses NavLink from react-router-dom so the active link gets an "active" CSS class
import { NavLink } from "react-router-dom";

// isLoggedIn will come from auth context later — hardcoded to false for now
const isLoggedIn = false;

function handleLogout() {
    // TODO: clear auth token from storage and update auth state
    alert("Logged out! (backend not connected yet)");
}

export default function Navbar() {
    return (
        <nav className="navbar">
            {/* Brand / Logo */}
            <NavLink to="/" className="navbar-brand">
                🎵 FOMO
            </NavLink>

            {/* Navigation links */}
            <div className="navbar-links">
                <NavLink to="/" end>Home</NavLink>
                <NavLink to="/events/popular">Popular</NavLink>

                {isLoggedIn ? (
                    <>
                        <NavLink to="/dashboard">Dashboard</NavLink>
                        <button className="navbar-logout" onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <>
                        <NavLink to="/login">Login</NavLink>
                        <NavLink to="/register" className="navbar-register">Register</NavLink>
                    </>
                )}
            </div>
        </nav>
    );
}

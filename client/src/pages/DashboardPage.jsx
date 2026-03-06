// Dashboard — shown after login, displays user info and quick links
// Will read real user data from context/auth state when backend is connected
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function DashboardPage() {
    const { user } = useAuth();
    if (!user) return null; // handled by ProtectedRoute, but safety first

    return (
        <main className="page page-narrow">
            <h1>Dashboard</h1>
            <p className="subtitle">Welcome back, <strong>{user.name || user.email.split('@')[0]}</strong>!</p>

            <div className="dashboard-info">
                <p>Email: {user.email}</p>
                <p>Role: <span className="role-badge">{user.role}</span></p>
            </div>

            <div className="dashboard-actions">
                {/* DANCER actions */}
                {user.role === "DANCER" && (
                    <Link to="/my-tickets" className="action-card">
                        My Tickets
                    </Link>
                )}

                {/* STUDIO / AGENCY actions */}
                {(user.role === "STUDIO" || user.role === "AGENCY") && (
                    <Link to="/create-event" className="action-card">
                        Create Event
                    </Link>
                )}

                <Link to="/" className="action-card">
                    Browse Events
                </Link>
            </div>
        </main>
    );
}

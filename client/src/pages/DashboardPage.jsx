// Dashboard — shown after login, displays user info and quick links
// Will read real user data from context/auth state when backend is connected
import { Link } from "react-router-dom";

export default function DashboardPage() {
    // Placeholder user — will come from auth context later
    const user = { name: "Alex Ivanov", email: "dancer@fomo.dev", role: "DANCER" };

    return (
        <main className="page page-narrow">
            <h1>Dashboard</h1>
            <p className="subtitle">Welcome back, <strong>{user.name}</strong>!</p>

            <div className="dashboard-info">
                <p>📧 {user.email}</p>
                <p>🎭 Role: <span className="role-badge">{user.role}</span></p>
            </div>

            <div className="dashboard-actions">
                {/* DANCER actions */}
                {user.role === "DANCER" && (
                    <Link to="/my-tickets" className="action-card">
                        🎟 My Tickets
                    </Link>
                )}

                {/* STUDIO / AGENCY actions */}
                {(user.role === "STUDIO" || user.role === "AGENCY") && (
                    <Link to="/create-event" className="action-card">
                        ➕ Create Event
                    </Link>
                )}

                <Link to="/" className="action-card">
                    🔍 Browse Events
                </Link>
            </div>
        </main>
    );
}

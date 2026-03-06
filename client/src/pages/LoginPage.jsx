// Login page — calls the real API and redirects on success
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate(); // used to redirect after login

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await login({ email, password });
            navigate("/dashboard"); // redirect to dashboard after successful login
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="page page-narrow">
            <h1>Login</h1>

            {/* Error message from the API */}
            {error && <div className="form-error">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoFocus
                    />
                </label>

                <label>
                    Password
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                </label>

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? "Logging in…" : "Login"}
                </button>
            </form>

            <p className="hint">
                Don't have an account? <Link to="/register">Register here</Link>
            </p>
        </main>
    );
}

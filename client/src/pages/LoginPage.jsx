import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import SocialAuthButtons from "../components/SocialAuthButtons.jsx";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Show error from OAuth redirect if present
    const oauthError = new URLSearchParams(location.search).get("error");

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await login({ email, password });
            const from = location.state?.from?.pathname || "/dashboard";
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="page page-narrow">
            <h1>Login</h1>

            {oauthError && (
                <div className="form-error">
                    {oauthError === "oauth_failed"
                        ? "Google sign-in failed. Please try again or use email."
                        : "Sign-in was cancelled."}
                </div>
            )}
            {error && <div className="form-error">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                    Email
                    <input
                        type="email"
                        name="email"
                        autoComplete="email"
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
                        name="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                </label>

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? "Logging in…" : "Login"}
                </button>

                <SocialAuthButtons label="sign in" />
            </form>

            <p className="hint">
                Don't have an account? <Link to="/register">Register here</Link>
            </p>
        </main>
    );
}

// Login page — email + password form
// Will call POST /api/auth/login when backend is connected
import { useState } from "react";
import { Link } from "react-router-dom";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    function handleSubmit(e) {
        e.preventDefault();
        // TODO: call POST /api/auth/login with { email, password }
        alert(`Login: ${email} (backend not connected yet)`);
    }

    return (
        <main className="page page-narrow">
            <h1>Login</h1>

            <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
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

                <button type="submit" className="btn-primary">Login</button>
            </form>

            <p className="hint">
                Don't have an account? <Link to="/register">Register here</Link>
            </p>
        </main>
    );
}

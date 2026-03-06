// Register page — calls the real API and redirects on success
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "DANCER",
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await register(form);
            navigate("/dashboard"); // redirect after successful registration
        } catch (err) {
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="page page-narrow">
            <h1>Create Account</h1>

            {/* Error message from the API (e.g. email already used) */}
            {error && <div className="form-error">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                    Name (optional)
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your name"
                    />
                </label>

                <label>
                    Email
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        required
                    />
                </label>

                <label>
                    Password
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Min 6 characters"
                        minLength={6}
                        required
                    />
                </label>

                <label>
                    I am a…
                    <select name="role" value={form.role} onChange={handleChange}>
                        <option value="DANCER">Dancer</option>
                        <option value="STUDIO">Studio</option>
                        <option value="AGENCY">Agency</option>
                    </select>
                </label>

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? "Creating account…" : "Create Account"}
                </button>
            </form>

            <p className="hint">
                Already have an account? <Link to="/login">Login here</Link>
            </p>
        </main>
    );
}

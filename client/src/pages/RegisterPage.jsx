// Register page — collect name, email, password, and role
// Will call POST /api/auth/register when backend is connected
import { useState } from "react";
import { Link } from "react-router-dom";

export default function RegisterPage() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "DANCER",
    });

    // Generic change handler — updates whichever field changed
    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function handleSubmit(e) {
        e.preventDefault();
        // TODO: call POST /api/auth/register with form data
        alert(`Register: ${form.email} as ${form.role} (backend not connected yet)`);
    }

    return (
        <main className="page page-narrow">
            <h1>Create Account</h1>

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

                <button type="submit" className="btn-primary">Create Account</button>
            </form>

            <p className="hint">
                Already have an account? <Link to="/login">Login here</Link>
            </p>
        </main>
    );
}

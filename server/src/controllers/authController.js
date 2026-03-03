import { registerUser, loginUser } from "../services/authService.js";

export async function register(req, res) {
    try {
        const { email, password, name, role } = req.body;
        const result = await registerUser({ email, password, name, role });
        return res.status(201).json(result);
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ message: err.message || "Register failed" });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;
        const result = await loginUser({ email, password });
        return res.json(result);
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ message: err.message || "Login failed" });
    }
}

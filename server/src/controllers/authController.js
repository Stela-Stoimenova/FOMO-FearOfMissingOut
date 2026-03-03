import { registerUser, loginUser } from "../services/authService.js";

export async function register(req, res, next) {
    try {
        const { email, password, name, role } = req.body;
        const result = await registerUser({ email, password, name, role });
        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}

export async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const result = await loginUser({ email, password });
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}

import { registerUser, loginUser } from "../services/authService.js";
import { googleCallback as exchangeGoogleCode } from "../services/oauthService.js";

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

/** Redirect browser to Google OAuth consent screen */
export function googleRedirect(req, res) {
    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(503).json({ error: { message: "Google OAuth not configured", status: 503 } });
    }
    const url = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        response_type: "code",
        scope: "email profile",
        access_type: "offline",
        prompt: "select_account",
    });
    res.redirect(url);
}

/** Handle Google's redirect-back with ?code= */
export async function googleCallback(req, res, next) {
    try {
        const { code, error } = req.query;

        if (error || !code) {
            const frontendBase = process.env.CORS_ORIGIN || "http://localhost:5174";
            return res.redirect(`${frontendBase}/auth/callback?error=access_denied`);
        }

        const { token, isNew } = await exchangeGoogleCode(code);
        const frontendBase = process.env.CORS_ORIGIN || "http://localhost:5174";
        res.redirect(`${frontendBase}/auth/callback?token=${token}${isNew ? "&new=1" : ""}`);
    } catch (err) {
        return next(err);
    }
}

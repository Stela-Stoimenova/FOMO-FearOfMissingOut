// src/context/AuthContext.jsx
// Provides auth state (current user + token) and login/register/logout actions
// to the entire app via React Context.

import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerUser } from "../api/auth.js";

// ─── JWT decode (no library needed) ─────────────────────────────────────────
// A JWT is three Base64 segments separated by dots.
// The middle segment (index 1) is the payload — our user data.
function decodeToken(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        // Check if the token has expired
        if (payload.exp && payload.exp * 1000 < Date.now()) return null;
        return payload; // { userId, email, role, iat, exp }
    } catch {
        return null; // malformed token
    }
}

// ─── Context ─────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
    // user = the decoded JWT payload: { userId, email, role }
    // null means not logged in
    const [user, setUser] = useState(() => {
        // On first render, try to restore session from localStorage
        const token = localStorage.getItem("token");
        return token ? decodeToken(token) : null;
    });

    /**
     * Login — calls the API, stores token, updates user state.
     * Throws if credentials are wrong (so the Login page can show the error).
     */
    async function login(credentials) {
        const data = await loginUser(credentials); // throws on 401
        localStorage.setItem("token", data.token);
        setUser(decodeToken(data.token));
        return data;
    }

    /**
     * Register — calls the API, stores token, updates user state.
     * Throws on validation errors (so the Register page can show them).
     */
    async function register(formData) {
        const data = await registerUser(formData); // throws on 400/409
        localStorage.setItem("token", data.token);
        setUser(decodeToken(data.token));
        return data;
    }

    /**
     * Logout — clears token from localStorage and resets user to null.
     */
    function logout() {
        localStorage.removeItem("token");
        setUser(null);
    }

    const value = {
        user,               // { userId, email, role } or null
        isLoggedIn: !!user, // convenient boolean
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────
// Usage in any component: const { user, login, logout, isLoggedIn } = useAuth();
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}

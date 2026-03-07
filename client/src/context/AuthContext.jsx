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
        // Try to get explicit user object first
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try { return JSON.parse(storedUser); } catch { }
        }
        // Fallback to decoding token if user object is missing
        const token = localStorage.getItem("token");
        return token ? decodeToken(token) : null;
    });

    /**
     * Login — calls the API, stores token and user, updates state.
     * Throws if credentials are wrong.
     */
    async function login(credentials) {
        const data = await loginUser(credentials); // throws on 401
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        return data;
    }

    /**
     * Register — calls the API, stores token and user, updates state.
     * Throws on validation errors.
     */
    async function register(formData) {
        const data = await registerUser(formData); // throws on 400/409
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        return data;
    }

    /**
     * Logout — clears token and user from localStorage and resets state.
     */
    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    }

    /**
     * Update User internally and in localStorage.
     */
    function updateLocalUser(newUserData) {
        localStorage.setItem("user", JSON.stringify(newUserData));
        setUser(newUserData);
    }

    const value = {
        user,               // { userId, email, role, avatarUrl } or null
        isLoggedIn: !!user, // convenient boolean
        login,
        register,
        logout,
        setUser: updateLocalUser,
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

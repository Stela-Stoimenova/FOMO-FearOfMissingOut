import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerUser } from "../api/auth.js";
import { getMe } from "../api/users.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUserState] = useState(null);
    const [bootstrapping, setBootstrapping] = useState(true);

    // On mount: if a token exists, re-fetch /users/me to get the canonical user shape.
    // This ensures stale localStorage data never leaks into the app.
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setBootstrapping(false);
            return;
        }
        getMe()
            .then(setUserState)
            .catch(() => {
                localStorage.removeItem("token");
            })
            .finally(() => setBootstrapping(false));
    }, []);

    async function login(credentials) {
        const data = await loginUser(credentials);
        localStorage.setItem("token", data.token);
        setUserState(data.user);
        return data;
    }

    async function register(formData) {
        const data = await registerUser(formData);
        localStorage.setItem("token", data.token);
        setUserState(data.user);
        return data;
    }

    function logout() {
        localStorage.removeItem("token");
        setUserState(null);
    }

    function updateLocalUser(newUserData) {
        setUserState(newUserData);
    }

    const value = {
        user,
        isLoggedIn: !!user,
        bootstrapping,
        login,
        register,
        logout,
        setUser: updateLocalUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}

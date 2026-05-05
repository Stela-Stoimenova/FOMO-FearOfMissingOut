// Handles the redirect from GET /api/auth/google/callback
// Server sends: /auth/callback?token=...  (or ?error=access_denied)
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getMe } from "../api/users.js";

export default function AuthCallbackPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setUser } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get("token");
        const error = params.get("error");
        const isNew = params.get("new") === "1";

        if (error || !token) {
            navigate("/login?error=oauth_failed", { replace: true });
            return;
        }

        localStorage.setItem("token", token);

        getMe()
            .then((user) => {
                setUser(user);
                // New OAuth users go to profile to complete their setup
                navigate(isNew ? "/profile?welcome=1" : "/dashboard", { replace: true });
            })
            .catch(() => {
                localStorage.removeItem("token");
                navigate("/login?error=oauth_failed", { replace: true });
            });
    }, []);

    return (
        <main className="page page-narrow" style={{ textAlign: "center", paddingTop: "4rem" }}>
            <p className="state-msg">Signing you in…</p>
        </main>
    );
}

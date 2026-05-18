const BASE_URL = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : "/api";

export async function apiRequest(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(localStorage.getItem("token")
                ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
                : {}),
            ...options.headers,
        },
        ...options,
    });

    const text = await response.text();

    // Expired or invalid token — clear session and redirect to login
    if (response.status === 401) {
        if (path.startsWith("/auth/")) {
            // Auth endpoint: surface the real error (e.g. "Invalid credentials")
            let data = null;
            try { data = text ? JSON.parse(text) : null; } catch {}
            const message = data?.error?.message || "Invalid credentials";
            const err = new Error(message);
            err.status = 401;
            throw err;
        }
        localStorage.removeItem("token");
        window.location.href = "/login";
        const err = new Error("Session expired. Please log in again.");
        err.status = 401;
        throw err;
    }
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        // non-JSON body handled below
    }

    if (!response.ok) {
        if (response.status === 404) {
            console.error(`[404] API route not found: ${BASE_URL}${path}`);
        }
        const message = data?.error?.message || (response.status === 404 ? "API route not found" : "Something went wrong");
        const err = new Error(message);
        err.status = response.status;
        throw err;
    }

    return data;
}

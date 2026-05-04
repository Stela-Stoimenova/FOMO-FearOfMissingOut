// Toast.jsx — lightweight fixed-position notification component
// Usage:
//   const [toast, setToast] = useState(null);  // { msg, type: 'success'|'error' }
//   <Toast toast={toast} onClose={() => setToast(null)} />
//
// Helper:
//   import { showToast } from './Toast.jsx';
//   showToast(setToast, 'Something went wrong', 'error');

import { useEffect } from "react";

/** Auto-dismiss a toast after `ms` milliseconds */
export function showToast(setToast, msg, type = "error", ms = 4000) {
    setToast({ msg, type });
    setTimeout(() => setToast(null), ms);
}

/** Map HTTP status codes to friendly messages */
export function friendlyError(err) {
    if (!err) return "Something went wrong";
    const status = err.status;
    if (status === 409) return err.message || "Already exists or conflicts with an existing record";
    if (status === 403) return "You don't have permission to do that";
    if (status === 404) return err.message || "Not found";
    if (status === 400) return err.message || "Invalid request — check your input";
    if (status === 401) return "Please log in to continue";
    return err.message || "Something went wrong — please try again";
}

export default function Toast({ toast, onClose }) {
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [toast, onClose]);

    if (!toast) return null;

    const isSuccess = toast.type === "success";

    return (
        <div
            role="alert"
            aria-live="polite"
            style={{
                position: "fixed",
                bottom: "2rem",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1rem 1.5rem",
                borderRadius: "16px",
                background: isSuccess
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(239, 68, 68, 0.15)",
                border: `1px solid ${isSuccess ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                color: isSuccess ? "var(--success)" : "#f87171",
                fontSize: "0.95rem",
                fontWeight: 600,
                maxWidth: "480px",
                width: "calc(100vw - 3rem)",
                animation: "slideUp 0.3s ease",
            }}
        >
            <span style={{ fontSize: "1.2rem" }}>{isSuccess ? "✓" : "⚠"}</span>
            <span style={{ flex: 1 }}>{toast.msg}</span>
            <button
                onClick={onClose}
                aria-label="Dismiss"
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "inherit",
                    fontSize: "1.2rem",
                    padding: "0 0.25rem",
                    opacity: 0.7,
                    lineHeight: 1,
                }}
            >
                ×
            </button>
        </div>
    );
}

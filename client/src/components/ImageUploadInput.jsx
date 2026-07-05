import { useState, useRef } from "react";
import { uploadImage } from "../api/uploads.js";

/**
 * Combined URL input + file upload button.
 * Props:
 *   value        – current URL string
 *   onChange(url) – called with new URL when changed
 *   placeholder  – input placeholder text
 */
export default function ImageUploadInput({ value, onChange, placeholder = "https://...", showPreview = true }) {
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = useRef(null);

    async function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setUploadError("");
        try {
            const { url } = await uploadImage(file);
            onChange(url);
        } catch (err) {
            setUploadError(err.message || "Upload failed");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder={placeholder}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{ flex: 1 }}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "10px",
                        background: "var(--accent-soft)",
                        color: "var(--accent)",
                        border: "1px solid var(--accent-border)",
                        cursor: uploading ? "not-allowed" : "pointer",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        opacity: uploading ? 0.6 : 1,
                        flexShrink: 0,
                    }}
                >
                    {uploading ? "Uploading…" : "Upload"}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                />
            </div>
            {uploadError && (
                <span style={{ fontSize: "0.78rem", color: "var(--warning)" }}>{uploadError}</span>
            )}
            {showPreview && value && (
                <img
                    src={value}
                    alt="Preview"
                    style={{ height: "60px", width: "auto", borderRadius: "8px", objectFit: "cover", border: "1px solid var(--border-light)" }}
                    onError={e => { e.target.style.display = "none"; }}
                />
            )}
        </div>
    );
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : "/api";

/**
 * POST /api/uploads/image
 * Upload an image file. Returns { url }.
 */
export async function uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${BASE_URL}/uploads/image`, {
        method: "POST",
        headers: {
            ...(localStorage.getItem("token")
                ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
                : {}),
        },
        body: formData,
    });

    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch {}

    if (!response.ok) {
        throw new Error(data?.error?.message || "Upload failed");
    }
    return data;
}

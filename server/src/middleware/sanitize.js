function sanitizeValue(value) {
    if (typeof value === "string") return value.trim();
    if (Array.isArray(value)) return value.map(sanitizeValue);
    if (value !== null && typeof value === "object") return sanitizeObject(value);
    return value;
}

function sanitizeObject(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = sanitizeValue(value);
    }
    return result;
}

export function sanitizeBody(req, res, next) {
    if (req.body && typeof req.body === "object") {
        req.body = sanitizeObject(req.body);
    }
    next();
}

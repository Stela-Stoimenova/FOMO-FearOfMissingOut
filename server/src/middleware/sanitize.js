/**
 * Sanitizes string fields in req.body by trimming whitespace.
 * Does not mutate non-string values.
 */
export function sanitizeBody(req, res, next) {
    if (req.body && typeof req.body === "object") {
        for (const [key, value] of Object.entries(req.body)) {
            if (typeof value === "string") {
                req.body[key] = value.trim();
            }
        }
    }
    next();
}

import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: { message: "Missing token", status: 401 } });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: { message: "Invalid token", status: 401 } });
  }
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { message: "Not authenticated", status: 401 } });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: { message: "Forbidden", status: 403 } });
    }
    return next();
  };
}


import jwt from "jsonwebtoken";
import { prisma } from "../db.js";

function signToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/** Exchange Google OAuth code for a FOMO JWT */
export async function googleCallback(code) {
  // Exchange code → access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      grant_type: "authorization_code",
      code,
    }),
  });

  if (!tokenRes.ok) {
    const err = new Error("Google token exchange failed");
    err.status = 502;
    throw err;
  }

  const tokens = await tokenRes.json();

  // Get user info from Google
  const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!infoRes.ok) {
    const err = new Error("Failed to fetch Google user info");
    err.status = 502;
    throw err;
  }

  const googleUser = await infoRes.json();

  // Upsert: find by googleId first, then by email (link existing account)
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { googleId: googleUser.id },
        { email: googleUser.email },
      ],
    },
  });

  if (!user) {
    // New user via Google — default role DANCER; they can change it
    user = await prisma.user.create({
      data: {
        email: googleUser.email,
        name: googleUser.name ?? null,
        avatarUrl: googleUser.picture ?? null,
        googleId: googleUser.id,
        role: "DANCER",
      },
    });
  } else if (!user.googleId) {
    // Existing email account — link Google ID
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: googleUser.id },
    });
  }

  return { token: signToken(user), isNew: !user.name };
}

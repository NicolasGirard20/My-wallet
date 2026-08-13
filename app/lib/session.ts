import { getIronSession, type SessionOptions } from "iron-session"
import { cookies } from "next/headers"

export interface SessionData {
  userId: number
  username: string
}

const sessionOptions: SessionOptions = {
  password: process.env.AUTH_SECRET || "a-very-long-secret-that-is-at-least-32-chars",
  cookieName: "mywallet_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}

export async function requireSession() {
  const session = await getSession()
  if (!session.userId) {
    throw new Error("No autorizado")
  }
  return session
}
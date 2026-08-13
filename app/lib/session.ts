import { getIronSession, type SessionOptions } from "iron-session"
import { cookies } from "next/headers"

export interface SessionData {
  userId: number
  username: string
}
//AUTH SECRET is used to encrypt the session cookie. It should be a long, random string that is kept secret. You can generate a secure random string using a tool like openssl or a password manager.
if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET is not set")

// Session options es una configuración para la sesión
const sessionOptions: SessionOptions = {
  password: process.env.AUTH_SECRET ,
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
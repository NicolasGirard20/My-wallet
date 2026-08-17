import { getIronSession } from "iron-session"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

interface SessionData {
  userId?: number
  username?: string
  role?: string
}

const sessionOptions = {
  password: process.env.AUTH_SECRET!,
  cookieName: "mywallet_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
}

const PUBLIC_ROUTES = ["/login"]
const DASHBOARD_PREFIX = ["/inicio", "/transferencias", "/ahorros", "/inversiones", "/usuarios"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_ROUTES.includes(pathname) || pathname === "/") {
    return NextResponse.next()
  }

  const isDashboardRoute = DASHBOARD_PREFIX.some((prefix) => pathname.startsWith(prefix))
  if (!isDashboardRoute) {
    return NextResponse.next()
  }

  if (request.method === "POST") {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const session = await getIronSession<SessionData>(request, response, sessionOptions)

  if (!session.userId) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (pathname.startsWith("/usuarios") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/inicio", request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
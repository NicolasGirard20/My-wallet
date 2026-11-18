import { describe, expect, it, vi } from "vitest"

vi.mock("iron-session", () => ({
  getIronSession: vi.fn(async (_cookies, options) => options),
}))

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({})),
}))

describe("configuración de sesión efímera", () => {
  it("getSession configura cookieOptions.maxAge como undefined (sesión de navegador)", async () => {
    process.env.AUTH_SECRET = "test-secret-for-vitest-at-least-32-chars!!"
    const { getSession } = await import("@/app/lib/session")
    const sessionOpts = (await getSession()) as unknown as {
      cookieName: string
      cookieOptions: { maxAge?: number; httpOnly: boolean; path: string }
    }

    expect(sessionOpts.cookieName).toBe("mywallet_session")
    expect(sessionOpts.cookieOptions.httpOnly).toBe(true)
    expect(sessionOpts.cookieOptions.path).toBe("/")
    expect(sessionOpts.cookieOptions.maxAge).toBeUndefined()
  })
})

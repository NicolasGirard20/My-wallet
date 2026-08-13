"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Wallet } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, hydrated } = useAuth()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (hydrated && isAuthenticated) router.replace("/inicio")
  }, [hydrated, isAuthenticated, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await login(username, password)
      if (result.ok) {
        toast.success("Bienvenido a My Wallet")
        router.replace("/inicio")
      } else {
        setError(result.error ?? "Error al iniciar sesión")
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Wallet className="size-6" />
          My Wallet
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-balance">
            Tus finanzas personales, claras y en un solo lugar.
          </h1>
          <p className="max-w-md text-primary-foreground/80 leading-relaxed">
            Controlá ingresos y gastos, seguí tus metas de ahorro y monitoreá tus inversiones.
            Cambiá entre dólares y pesos con un solo click.
          </p>
        </div>
        <div className="flex gap-8">
          {[
            { k: "Ingresos", v: "y gastos" },
            { k: "Ahorros", v: "con metas" },
            { k: "Inversiones", v: "con evolución" },
          ].map((item) => (
            <div key={item.k} className="flex flex-col">
              <span className="font-semibold">{item.k}</span>
              <span className="text-sm text-primary-foreground/70">{item.v}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 text-lg font-semibold lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="size-5" />
            </span>
            My Wallet
          </div>

          <div className="mb-6 flex flex-col gap-1.5">
            <h2 className="text-2xl font-bold tracking-tight">Iniciar sesión</h2>
            <p className="text-sm text-muted-foreground">
              Ingresá con tus credenciales para acceder a tu billetera.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field data-invalid={error ? true : undefined}>
                <FieldLabel htmlFor="username">Usuario</FieldLabel>
                <Input
                  id="username"
                  value={username}
                  autoComplete="username"
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setError(null)
                  }}
                  aria-invalid={error ? true : undefined}
                />
              </Field>

              <Field data-invalid={error ? true : undefined}>
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pr-10"
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError(null)
                    }}
                    aria-invalid={error ? true : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>

              {error ? (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {error}
                </p>
              ) : null}

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>
            </FieldGroup>
          </form>

        </div>
      </section>
    </main>
  )
}
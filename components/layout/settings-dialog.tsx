"use client"

import { Check, KeyRound, Mail, Moon, ShieldCheck, Sun, User as UserIcon } from "lucide-react"

import { useAuth } from "@/context/auth-context"
import { useCurrency } from "@/context/currency-context"
import { useThemePalette } from "@/context/theme-palette-context"
import { THEME_PALETTES, type ThemePalette } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenChangePassword: () => void
}

const LIGHT_PALETTES = THEME_PALETTES.filter((palette) => palette.mode === "light")
const DARK_PALETTES = THEME_PALETTES.filter((palette) => palette.mode === "dark")

function getInitials(name?: string | null, username?: string | null): string {
  const trimmedName = (name ?? "").trim()
  if (trimmedName) {
    const parts = trimmedName.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return trimmedName.slice(0, 2).toUpperCase()
  }
  return (username ?? "U").slice(0, 2).toUpperCase()
}

function formatMemberSince(createdAt?: string | null): string | null {
  if (!createdAt) return null
  const parsed = new Date(createdAt)
  if (Number.isNaN(parsed.getTime())) return null
  const formatted = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed)
  return `Miembro desde ${formatted}`
}

interface PaletteCardProps {
  palette: ThemePalette
  selected: boolean
  onSelect: () => void
}

function PaletteCard({ palette, selected, onSelect }: PaletteCardProps) {
  const { preview } = palette

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "group relative flex w-full flex-col gap-2.5 rounded-xl border bg-card p-3 text-left transition-all outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
        selected
          ? "border-primary ring-2 ring-primary/25 shadow-sm"
          : "border-border hover:border-foreground/25 hover:bg-muted/30"
      )}
    >
      {/* Mini vista previa visual de la atmósfera + acento vivo de moneda */}
      <div
        className="relative flex h-20 w-full overflow-hidden rounded-lg border"
        style={{
          backgroundColor: preview.background,
          borderColor: preview.border,
        }}
        aria-hidden="true"
      >
        {/* Sidebar simulado */}
        <div
          className="flex w-11 shrink-0 flex-col gap-1.5 border-r p-2"
          style={{
            backgroundColor: preview.sidebar,
            borderColor: preview.border,
          }}
        >
          <div
            className="h-2 w-full rounded-sm"
            style={{ backgroundColor: "var(--primary)" }}
          />
          <div
            className="h-1.5 w-4/5 rounded-sm opacity-25"
            style={{ backgroundColor: preview.foreground }}
          />
          <div
            className="h-1.5 w-3/5 rounded-sm opacity-20"
            style={{ backgroundColor: preview.foreground }}
          />
        </div>

        {/* Área principal con tarjeta y botón/barra en var(--primary) */}
        <div className="flex flex-1 flex-col justify-between p-2">
          <div
            className="flex flex-col gap-1.5 rounded-md border p-2"
            style={{
              backgroundColor: preview.card,
              borderColor: preview.border,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="h-1.5 w-12 rounded-sm opacity-65"
                style={{ backgroundColor: preview.foreground }}
              />
              <span
                className="h-2 w-7 rounded-full"
                style={{ backgroundColor: "var(--primary)" }}
              />
            </div>
            <div
              className="h-1.5 w-16 rounded-sm opacity-25"
              style={{ backgroundColor: preview.foreground }}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-10 rounded-full"
              style={{ backgroundColor: "var(--primary)" }}
            />
            <span
              className="h-1.5 w-8 rounded-full opacity-20"
              style={{ backgroundColor: preview.foreground }}
            />
          </div>
        </div>

        {selected && (
          <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
            <Check className="size-3 stroke-[2.5]" />
          </span>
        )}
      </div>

      {/* Nombre y descripción de 1 línea */}
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {palette.name}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {palette.description}
        </p>
      </div>
    </button>
  )
}

export function SettingsDialog({
  open,
  onOpenChange,
  onOpenChangePassword,
}: SettingsDialogProps) {
  const { user } = useAuth()
  const { currency } = useCurrency()
  const { paletteId, setPalette } = useThemePalette()

  const initials = getInitials(user?.name, user?.username)
  const displayName = user?.name?.trim() || user?.username || "Usuario"
  const memberSince = formatMemberSince(user?.createdAt)
  const isAdmin = user?.role === "admin"

  function handleChangePasswordClick() {
    onOpenChange(false)
    onOpenChangePassword()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85dvh] overflow-y-auto p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Configuración</DialogTitle>
          <DialogDescription>
            Consultá los datos de tu cuenta y elegí la atmósfera visual de la aplicación.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 pt-1">
          {/* Sección 1 — Información de cuenta (solo lectura) */}
          <section aria-labelledby="settings-account-heading" className="flex flex-col gap-3">
            <h3
              id="settings-account-heading"
              className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              Información de cuenta
            </h3>

            <div className="flex flex-col gap-4 rounded-xl border bg-muted/25 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5 min-w-0">
                <Avatar className="size-12 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-base font-semibold leading-tight">
                      {displayName}
                    </span>
                    <Badge variant={isAdmin ? "default" : "secondary"}>
                      {isAdmin ? (
                        <ShieldCheck data-icon="inline-start" />
                      ) : (
                        <UserIcon data-icon="inline-start" />
                      )}
                      {isAdmin ? "Administrador" : "Usuario"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {user?.username && (
                      <span className="font-medium text-foreground/80">
                        @{user.username}
                      </span>
                    )}
                    {user?.email && (
                      <span className="inline-flex items-center gap-1 truncate">
                        <Mail className="size-3 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </span>
                    )}
                  </div>

                  {memberSince && (
                    <p className="text-xs text-muted-foreground">{memberSince}</p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 self-start sm:self-center"
                onClick={handleChangePasswordClick}
              >
                <KeyRound className="size-4" data-icon="inline-start" />
                Cambiar contraseña
              </Button>
            </div>
          </section>

          <Separator />

          {/* Sección 2 — Preferencias de apariencia */}
          <section aria-labelledby="settings-appearance-heading" className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3
                  id="settings-appearance-heading"
                  className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Preferencias de apariencia
                </h3>

                <span className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground">
                  <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
                  {currency === "USD"
                    ? "Moneda activa: USD (Esmeralda)"
                    : "Moneda activa: ARS (Celeste)"}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                Elegí la atmósfera de fondo y superficies. El color de acento sigue siendo
                definido automáticamente por tu moneda activa para mantener claros los
                indicadores de USD y ARS.
              </p>
            </div>

            {/* Atmósferas claras */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Sun className="size-3.5 text-muted-foreground" />
                <span>Atmósferas claras</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {LIGHT_PALETTES.map((palette) => (
                  <PaletteCard
                    key={palette.id}
                    palette={palette}
                    selected={paletteId === palette.id}
                    onSelect={() => {
                      void setPalette(palette.id)
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Atmósferas oscuras */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Moon className="size-3.5 text-muted-foreground" />
                <span>Atmósferas oscuras</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {DARK_PALETTES.map((palette) => (
                  <PaletteCard
                    key={palette.id}
                    palette={palette}
                    selected={paletteId === palette.id}
                    onSelect={() => {
                      void setPalette(palette.id)
                    }}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

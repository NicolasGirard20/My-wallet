"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { createUserAction, updateUserAction } from "@/app/actions/users"
import type { User } from "@/lib/types"

interface UserFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
  onSuccess: () => void
}

export function UserForm({ open, onOpenChange, user, onSuccess }: UserFormProps) {
  const isEditing = !!user
  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [username, setUsername] = useState(user?.username ?? "")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function resetForm() {
    setName(user?.name ?? "")
    setEmail(user?.email ?? "")
    setUsername(user?.username ?? "")
    setPassword("")
    setConfirmPassword("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Ingresá un email válido")
      return
    }
    if (!isEditing && !username.trim()) {
      toast.error("El nombre de usuario es obligatorio")
      return
    }
    if (!isEditing && (!password || password.length < 6)) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }
    if (!isEditing && password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }
    if (isEditing && password && password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }
    if (isEditing && password && password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setSubmitting(true)

    if (isEditing && user) {
      const result = await updateUserAction(user.id, {
        name: name.trim(),
        email: email.trim(),
        ...(password ? { password } : {}),
      })
      setSubmitting(false)
      if (!result.ok) {
        toast.error(result.error ?? "No se pudo actualizar el usuario")
        return
      }
      toast.success("Usuario actualizado correctamente")
    } else {
      const result = await createUserAction({
        username: username.trim(),
        password,
        name: name.trim(),
        email: email.trim(),
      })
      setSubmitting(false)
      if (!result.ok) {
        toast.error(result.error ?? "No se pudo crear el usuario")
        return
      }
      toast.success("Usuario creado correctamente")
    }

    onOpenChange(false)
    resetForm()
    onSuccess()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm()
        onOpenChange(o)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar usuario" : "Agregar usuario"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualizá los datos del usuario. Dejá la contraseña en blanco si no querés cambiarla."
              : "Completá los datos para crear un nuevo usuario."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} id="user-form">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="user-name">Nombre</FieldLabel>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="user-email">Email</FieldLabel>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            {!isEditing && (
              <Field>
                <FieldLabel htmlFor="user-username">Usuario</FieldLabel>
                <Input
                  id="user-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="user-password">
                {isEditing ? "Nueva contraseña (opcional)" : "Contraseña"}
              </FieldLabel>
              <Input
                id="user-password"
                type="password"
                autoComplete={isEditing ? "new-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!isEditing}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="user-confirm-password">
                {isEditing ? "Confirmar nueva contraseña" : "Confirmar contraseña"}
              </FieldLabel>
              <Input
                id="user-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={!isEditing || !!password}
              />
            </Field>
            </FieldGroup>
        </form>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button type="submit" form="user-form" disabled={submitting}>
            <Settings className="size-4" data-icon="inline-start" />
            {submitting ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
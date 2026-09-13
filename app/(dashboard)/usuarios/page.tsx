"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/context/auth-context"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { UserTable } from "@/components/usuarios/user-table"
import { UserForm } from "@/components/usuarios/user-form"
import { getUsersAction, deleteUserAction, getUserDataSizeAction } from "@/app/actions/users"
import type { User } from "@/lib/types"

export default function UsuariosPage() {
  const router = useRouter()
  const { isAdmin, hydrated } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [userSizes, setUserSizes] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    if (hydrated && !isAdmin) {
      router.replace("/inicio")
    }
  }, [hydrated, isAdmin, router])

  const loadUsers = useCallback(async () => {
    try {
      const data = await getUsersAction()
      setUsers(data)
      const sizes: Record<number, string> = {}
      for (const u of data) {
        sizes[u.id] = await getUserDataSizeAction(u.id)
      }
      setUserSizes(sizes)
    } catch {
      toast.error("Error al cargar los usuarios")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (hydrated && isAdmin) {
      loadUsers()
    }
  }, [hydrated, isAdmin, loadUsers])

  async function handleDelete(id: number) {
    const result = await deleteUserAction(id)
    if (!result.ok) {
      toast.error(result.error ?? "No se pudo eliminar el usuario")
      return
    }
    toast.success("Usuario eliminado correctamente")
    loadUsers()
  }

  function openCreateForm() {
    setEditingUser(null)
    setFormOpen(true)
  }

  function openEditForm(user: User) {
    setEditingUser(user)
    setFormOpen(true)
  }

  if (!hydrated || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-muted-foreground">Cargando…</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestión de Usuarios"
        description="Administrá los usuarios del sistema, sus roles y accesos."
        actions={
          <Button onClick={openCreateForm}>
            <PlusIcon className="size-4" data-icon="inline-start" />
            Agregar usuario
          </Button>
        }
      />

      <UserTable
        users={users}
        userSizes={userSizes}
        onEdit={openEditForm}
        onDelete={handleDelete}
      />

      <UserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editingUser}
        onSuccess={loadUsers}
      />
    </div>
  )
}
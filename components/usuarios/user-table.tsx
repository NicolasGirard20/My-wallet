"use client"

import { useMemo, useState } from "react"
import { PencilIcon, Trash2Icon, SearchIcon } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { UserSizeDisplay } from "@/components/usuarios/user-size-display"
import { formatDate } from "@/lib/format"
import type { User } from "@/lib/types"

interface UserTableProps {
  users: User[]
  userSizes: Record<number, string>
  onEdit: (user: User) => void
  onDelete: (id: number) => void
}

export function UserTable({ users, userSizes, onEdit, onDelete }: UserTableProps) {
  const [query, setQuery] = useState("")
  const [pendingDelete, setPendingDelete] = useState<User | null>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return users
    const q = query.toLowerCase()
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q),
    )
  }, [users, query])

  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, email o usuario"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyTitle>Sin resultados</EmptyTitle>
            <EmptyDescription>
              {query ? "No se encontraron usuarios con ese criterio." : "No hay usuarios registrados."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Tamaño estimado</TableHead>
                <TableHead>Fecha de creación</TableHead>
                <TableHead className="w-20 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-muted-foreground">{u.username}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                      {u.role === "admin" ? "Admin" : "Usuario"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <UserSizeDisplay size={userSizes[u.id] ?? "—"} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(u.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(u)}
                        aria-label="Editar usuario"
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDelete(u)}
                        aria-label="Eliminar usuario"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Eliminar usuario"
        description={
          pendingDelete
            ? `¿Seguro que querés eliminar a "${pendingDelete.name}"? Esta acción no se puede deshacer y se perderán todos sus datos asociados.`
            : ""
        }
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (pendingDelete) {
            onDelete(pendingDelete.id)
            setPendingDelete(null)
          }
        }}
      />
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Users, Shield, Trash2, ShieldCheck, ShieldX } from 'lucide-react'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api' // Usamos el objeto unificado
import { formatDate } from '@/lib/utils'
import type { User } from '@/lib/types'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
  try {
    setIsLoading(true);
    
    // Tipamos la respuesta como 'any' temporalmente o usamos el tipo User[] 
    // para que TS nos deje trabajar con la estructura.
    const data: any = await adminApi.getUsers();
    
    console.log("Revisando estructura de datos:", data);

    if (Array.isArray(data)) {
      // Si el backend devuelve [user1, user2...]
      setUsers(data);
    } else if (data && typeof data === 'object' && 'items' in data && Array.isArray(data.items)) {
      // Si el backend devuelve { items: [...], total: 10 }
      setUsers(data.items);
    } else {
      setUsers([]);
    }
  } catch (error) {
    console.error('Error loading users:', error);
    toast.error('Error al cargar usuarios');
    setUsers([]);
  } finally {
    setIsLoading(false);
  }
}

  async function handleDelete(userId: string) {
    try {
      // Cambio: usamos adminApi.deleteUser()
      await adminApi.deleteUser(userId)
      setUsers(users.filter((u) => u.id !== userId))
      toast.success('Usuario eliminado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar')
    }
  }

  async function handleToggleAdmin(userId: string) {
    try {
      // ✅ Cambio: usamos adminApi.toggleAdmin()
      const updatedUser = await adminApi.toggleAdmin(userId)
      
      setUsers(users.map((u) => (u.id === userId ? updatedUser : u)))
      
      const isAdmin = updatedUser.rol === 'admin'
      toast.success(
        isAdmin ? 'Usuario promovido a admin' : 'Admin removido'
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cambiar rol')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Lista de Usuarios
              </CardTitle>
              <CardDescription>
                {users.length} usuarios registrados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron usuarios.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const isAdmin = user.rol === 'admin'

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nombre}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.telefono || '-'}</TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <Badge className="bg-primary">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Usuario</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleAdmin(user.id)}
                            title={isAdmin ? 'Quitar admin' : 'Hacer admin'}
                          >
                            {isAdmin ? (
                              <ShieldX className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará permanentemente a {user.nombre} y todas sus mascotas registradas. Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}